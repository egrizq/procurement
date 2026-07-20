import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('./api.js', () => ({
  getAuditLogs: vi.fn(),
  getAuditLogById: vi.fn(),
}))

import { getAuditLogs, getAuditLogById } from './api.js'
import { useAuditLogStore } from './store.js'

describe('audit log store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows audit logs returned by the API payload', async () => {
    getAuditLogs.mockResolvedValue({
      auditLogs: [{ id: 101, action: 'CREATE' }],
      pagination: { current_page: 1, total_items: 1 },
    })

    const store = useAuditLogStore()
    await store.fetchLogs(1)

    expect(store.logs).toEqual([{ id: 101, action: 'CREATE' }])
    expect(store.pagination).toEqual({ current_page: 1, total_items: 1 })
  })

  it('stores an audit log detail returned by the API payload', async () => {
    getAuditLogById.mockResolvedValue({
      auditLog: { id: 101, action: 'CREATE', description: 'Created request' },
    })

    const store = useAuditLogStore()
    await store.fetchLogById(101)

    expect(store.selectedLog).toEqual({ id: 101, action: 'CREATE', description: 'Created request' })
  })
})
