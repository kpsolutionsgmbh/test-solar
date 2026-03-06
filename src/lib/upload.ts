export async function uploadFile(file: File, bucket: string): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) return null;

  const { url } = await res.json();
  return url;
}
