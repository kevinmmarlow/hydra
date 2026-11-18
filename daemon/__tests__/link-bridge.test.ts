import { describe, test, expect } from 'bun:test'
import { mkdtempSync, writeFileSync, readlinkSync, lstatSync, symlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { linkBridge } from '../plugin-manifest.js'

/**
 * bridge.ts imports ./shared/* relative to itself. A copy in the plugin cache
 * resolves those against the cache dir and dies on boot, so it must be a link.
 */
describe('linkBridge', () => {
  const setup = () => {
    const dir = mkdtempSync(join(tmpdir(), 'link-bridge-'))
    const src = join(dir, 'bridge.ts')
    writeFileSync(src, '// bridge\n')
    return { dir, src, dest: join(dir, 'server.ts') }
  }

  test('replaces a copied server.ts with a link to bridge.ts', () => {
    const { dir, src, dest } = setup()
    writeFileSync(dest, '// stale copy\n')
    linkBridge(src, dir)
    expect(lstatSync(dest).isSymbolicLink()).toBe(true)
    expect(readlinkSync(dest)).toBe(src)
  })

  test('creates the link when server.ts is absent', () => {
    const { dir, src, dest } = setup()
    linkBridge(src, dir)
    expect(readlinkSync(dest)).toBe(src)
  })

  test('leaves an existing link to bridge.ts in place', () => {
    const { dir, src, dest } = setup()
    symlinkSync(src, dest)
    linkBridge(src, dir)
    expect(readlinkSync(dest)).toBe(src)
  })
})
