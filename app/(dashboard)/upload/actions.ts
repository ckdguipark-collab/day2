'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseExcel } from '@/lib/excel/parseExcel'
import { wideToLong } from '@/lib/excel/wideToLong'

export async function createUploadRecord(fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('uploads')
    .insert({ file_name: fileName, status: 'processing', uploaded_by: user?.id })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { uploadId: data.id }
}

export async function processUpload(uploadId: string, formData: FormData) {
  const supabase = await createClient()

  try {
    const file = formData.get('file') as File | null
    if (!file) throw new Error('파일을 찾을 수 없습니다')

    const buffer = await file.arrayBuffer()

    // 원본 파일 Storage 저장
    const { error: storageError } = await supabase.storage
      .from('excel-uploads')
      .upload(`${uploadId}/${file.name}`, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      })
    if (storageError) throw new Error(`Storage 오류: ${storageError.message}`)

    // Excel 파싱
    const { rawRows, brickRows } = parseExcel(Buffer.from(buffer))

    // brick_master upsert (500행 청크)
    const BRICK_CHUNK = 500
    for (let i = 0; i < brickRows.length; i += BRICK_CHUNK) {
      const chunk = brickRows.slice(i, i + BRICK_CHUNK)
      const { error } = await supabase
        .from('brick_master')
        .upsert(chunk, { onConflict: 'brick_code' })
      if (error) throw new Error(`brick_master 저장 오류: ${error.message}`)
    }

    // Wide → Long 변환
    const longRows = wideToLong(rawRows)

    // monthly_ddd upsert (1,000행 청크)
    const DDD_CHUNK = 1000
    let processedRows = 0
    for (let i = 0; i < longRows.length; i += DDD_CHUNK) {
      const chunk = longRows.slice(i, i + DDD_CHUNK).map(row => ({
        ...row,
        upload_id: uploadId,
      }))
      const { error } = await supabase
        .from('monthly_ddd')
        .upsert(chunk, { onConflict: 'brick_code,year_month,product_brand,pack' })
      if (error) throw new Error(`monthly_ddd 저장 오류: ${error.message}`)

      processedRows += chunk.length
      await supabase
        .from('uploads')
        .update({ row_count: processedRows })
        .eq('id', uploadId)
    }

    // 완료
    await supabase
      .from('uploads')
      .update({ status: 'done', row_count: longRows.length })
      .eq('id', uploadId)

    revalidatePath('/upload')
    return { success: true, rowCount: longRows.length }

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
    await supabase
      .from('uploads')
      .update({ status: 'error', error_message: message })
      .eq('id', uploadId)
    return { success: false, error: message }
  }
}
