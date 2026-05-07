import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/session'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
// Allowlist of extensions — double-check against MIME type
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export async function POST(request: NextRequest) {
  // ── Authentication required ──────────────────────────────────────────────
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // ── Only sellers and admins may upload product images ────────────────────
  if (!['SELLER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Only sellers and admins can upload images.' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // ── MIME-type validation (from Content-Type header) ───────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 },
      )
    }

    // ── File size check ───────────────────────────────────────────────────
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 5 MB.' }, { status: 400 })
    }

    // ── Extension allowlist check (double validation) ─────────────────────
    const originalExt = extname(file.name).toLowerCase()
    if (!ALLOWED_EXTS.includes(originalExt)) {
      return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 })
    }

    // ── Verify magic bytes (file signature) ───────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isAllowedMagicBytes(buffer)) {
      return NextResponse.json({ error: 'File content does not match image format.' }, { status: 400 })
    }

    // ── Generate a cryptographically random filename ───────────────────────
    // Never use the original filename — prevents path traversal and injection
    const randomName = randomBytes(16).toString('hex')
    const ext = originalExt.replace('.', '')
    const filename = `product-${randomName}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('[Upload]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

// ── Magic bytes verification ──────────────────────────────────────────────────
// Checks the first few bytes of the file to verify it is actually an image.
function isAllowedMagicBytes(buffer: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true
  // WebP: RIFF????WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true

  return false
}
