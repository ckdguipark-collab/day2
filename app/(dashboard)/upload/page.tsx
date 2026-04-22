import { createClient } from '@/lib/supabase/server'
import UploadForm from '@/components/upload/UploadForm'
import type { Tables } from '@/types/database.types'

type UploadRow = Tables<'uploads'>

const STATUS_LABEL: Record<string, string> = {
  done: '완료',
  processing: '처리 중',
  error: '오류',
}
const STATUS_STYLE: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function UploadPage() {
  const supabase = await createClient()

  const { data: uploads } = await supabase
    .from('uploads')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(20)

  const rows: UploadRow[] = uploads ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Excel 업로드</h1>
        <p className="text-gray-500 text-sm mt-1">DDD 데이터 및 브릭마스터 Excel 파일을 업로드합니다</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <UploadForm />
      </section>

      {rows.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">업로드 이력</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">파일명</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">업로드 일시</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">행 수</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium max-w-[220px] truncate">
                      {row.file_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(row.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-right tabular-nums">
                      {row.row_count != null ? row.row_count.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                      {row.status === 'error' && row.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate" title={row.error_message}>
                          {row.error_message}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
