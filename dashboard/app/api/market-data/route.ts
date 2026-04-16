import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const SOURCES = ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH'] as const
type Source = (typeof SOURCES)[number]

const DEFAULT_DATA_SOURCE: Source = 'ON_CHAIN'
const DEFAULT_FALLBACK: Source[] = ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH']

function isSource(v: unknown): v is Source {
  return typeof v === 'string' && SOURCES.includes(v as Source)
}

function filePath() {
  return path.resolve(process.cwd(), 'public/market_data_config.json')
}

function readConfig(): { dataSource: Source; fallbackOrder: Source[] } {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8')
    const json = JSON.parse(raw)
    const dataSource = isSource(json?.dataSource) ? json.dataSource : DEFAULT_DATA_SOURCE
    const fallbackOrder = Array.isArray(json?.fallbackOrder)
      ? json.fallbackOrder.filter((v: unknown): v is Source => isSource(v))
      : DEFAULT_FALLBACK
    return {
      dataSource,
      fallbackOrder: fallbackOrder.length ? fallbackOrder : DEFAULT_FALLBACK,
    }
  } catch {
    return {
      dataSource: DEFAULT_DATA_SOURCE,
      fallbackOrder: DEFAULT_FALLBACK,
    }
  }
}

function writeConfig(next: { dataSource: Source; fallbackOrder: Source[] }) {
  fs.writeFileSync(filePath(), JSON.stringify(next, null, 2))
}

export async function GET() {
  return NextResponse.json(readConfig())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const curr = readConfig()
    const dataSource = isSource(body?.dataSource) ? body.dataSource : curr.dataSource
    const fallbackOrder = Array.isArray(body?.fallbackOrder)
      ? body.fallbackOrder.filter((v: unknown): v is Source => isSource(v))
      : curr.fallbackOrder

    const next = {
      dataSource,
      fallbackOrder: fallbackOrder.length ? fallbackOrder : curr.fallbackOrder,
    }

    writeConfig(next)
    return NextResponse.json({ ok: true, ...next })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
