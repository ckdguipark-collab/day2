'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { createUploadRecord, processUpload } from '@/app/(dashboard)/upload/actions'

const MAX_BYTES = 50 * 1024 * 1024
const MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20(24|25)$/

interface SheetSummary {
  name: string
  type: 'raw' | 'brick_master' | 'unknown'
  rowCount: number
  headers: string[]
  sampleRows: Record<string, unknown>[]
}

interface ProgressState {
  status: string
  row_count: number | null
  error_message: string | null
}

type UploadState = 'idle' | 'ready' | 'uploading' | 'done' | 'error'

const SHEET_TYPE_LABEL: Record<SheetSummary['type'], string> = {
  raw: 'DDD 데이터',
  brick_master: '브릭마스터',
  unknown: '미인식',
}
const SHEET_TYPE_COLOR: Record<SheetSummary['type'], string> = {
  raw: 'bg-blue-100 text-blue-700',
  brick_master: 'bg-green-100 text-green-700',
  unknown: 'bg-gray-100 text-gray-500',
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadForm() {
  const supabase = useMemo(() => createClient(), [])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<SheetSummary[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [supabase])

  const loadPreview = useCallback(async (f: File) => {
    const { read, utils } = await import('xlsx')
    const buf = await f.arrayBuffer()
    const wb = read(buf, { type: 'array' })

    const summaries: SheetSummary[] = wb.SheetNames.map(name => {
      const ws = wb.Sheets[name]
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
      const headers = rows.length ? Object.keys(rows[0]) : []
      const hasMonths = headers.some(h => MONTH_RE.test(h))
      const hasDivision = headers.some(h =>
        ['사업부', 'division', 'Division'].some(k => h.includes(k))
      )
      const type = hasMonths ? 'raw' : hasDivision ? 'brick_master' : 'unknown'
      return { name, type, rowCount: rows.length, headers, sampleRows: rows.slice(0, 5) }
    })
    setSheets(summaries)
  }, [])

  const handleFile = useCallback(async (f: File) => {
    setErrorMsg(null)
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMsg('.xlsx 파일만 업로드할 수 있습니다.')
      return
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg(`파일 크기(${formatBytes(f.size)})가 50MB를 초과합니다.`)
      return
    }
    setFile(f)
    setUploadState('ready')
    setSheets([])
    await loadPreview(f)
  }, [loadPreview])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleUpload = async () => {
    if (!file) return
    setUploadState('uploading')
    setErrorMsg(null)

    try {
      const { uploadId } = await createUploadRecord(file.name)
      setProgress({ status: 'processing', row_count: null, error_message: null })

      channelRef.current = supabase
        .channel(`upload-progress-${uploadId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'uploads',
          filter: `id=eq.${uploadId}`,
        }, (payload) => {
          const rec = payload.new as ProgressState & { id: string }
          setProgress({ status: rec.status, row_count: rec.row_count, error_message: rec.error_message })
        })
        .subscribe()

      const fd = new FormData()
      fd.append('file', file)
      const result = await processUpload(uploadId, fd)

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      if (result.success) {
        setUploadState('done')
        setProgress({ status: 'done', row_count: result.rowCount ?? null, error_message: null })
      } else {
        setUploadState('error')
        setErrorMsg(result.error ?? '업로드 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setUploadState('error')
      setErrorMsg(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    }
  }

  const handleReset = () => {
    setFile(null)
    setSheets([])
    setUploadState('idle')
    setProgress(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ─── 완료/오류 상태 ───────────────────────────────────────────────
  if (uploadState === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-green-700 font-semibold text-lg">업로드 완료</p>
        {progress?.row_count != null && (
          <p className="text-green-600 mt-1 text-sm">{progress.row_count.toLocaleString()}행 처리됨</p>
        )}
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          새 파일 업로드
        </button>
      </div>
    )
  }

  // ─── 업로드 중 상태 ───────────────────────────────────────────────
  if (uploadState === 'uploading') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 font-medium">업로드 처리 중...</p>
        {progress?.row_count != null && (
          <p className="text-gray-500 text-sm mt-1">
            처리된 행: {progress.row_count.toLocaleString()}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-2">대용량 파일은 수 분이 걸릴 수 있습니다</p>
      </div>
    )
  }

  // ─── 기본 폼 ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      <div
        onDragEnter={() => setIsDragOver(true)}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : file
              ? 'border-blue-300 bg-blue-50/50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <>
            <p className="text-blue-600 font-medium">{file.name}</p>
            <p className="text-gray-400 text-sm mt-1">{formatBytes(file.size)}</p>
            <p className="text-gray-400 text-xs mt-2">클릭하여 다른 파일 선택</p>
          </>
        ) : (
          <>
            <p className="text-gray-500 font-medium">파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-gray-400 text-sm mt-1">.xlsx 파일 · 최대 50MB</p>
          </>
        )}
      </div>

      {/* 유효성 오류 */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* 시트 미리보기 */}
      {sheets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">시트 미리보기</h3>
          {sheets.map(sheet => (
            <div key={sheet.name} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-sm">{sheet.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHEET_TYPE_COLOR[sheet.type]}`}>
                  {SHEET_TYPE_LABEL[sheet.type]}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{sheet.rowCount.toLocaleString()}행</span>
              </div>

              {sheet.sampleRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {sheet.headers.slice(0, 10).map(h => (
                          <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap border-b border-gray-200">
                            {h}
                          </th>
                        ))}
                        {sheet.headers.length > 10 && (
                          <th className="px-3 py-2 text-gray-400 border-b border-gray-200">
                            +{sheet.headers.length - 10}개
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.sampleRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          {sheet.headers.slice(0, 10).map(h => (
                            <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[160px] truncate">
                              {row[h] != null ? String(row[h]) : ''}
                            </td>
                          ))}
                          {sheet.headers.length > 10 && <td />}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">데이터 없음</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      {file && (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            업로드 시작
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
