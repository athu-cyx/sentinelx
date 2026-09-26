import { useEffect, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

type Customer = {
  id: string
  username: string
  email: string
  role: string
  organization_name: string
  is_active: boolean
  created_at: string
}

type Organization = {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('sentinelx_access_token')

  return {
    Authorization: `Bearer ${token || ''}`,
    'Content-Type': 'application/json',
  }
}

export default function SuperAdminPanel() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [organizationName, setOrganizationName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [customersResponse, organizationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customers/`, {
          headers: getHeaders(),
        }),
        fetch(`${API_BASE_URL}/api/organizations/`, {
          headers: getHeaders(),
        }),
      ])

      if (!customersResponse.ok) {
        throw new Error(`Customers API error: ${customersResponse.status}`)
      }

      if (!organizationsResponse.ok) {
        throw new Error(`Organizations API error: ${organizationsResponse.status}`)
      }

      const customersData = await customersResponse.json()
      const organizationsData = await organizationsResponse.json()

      setCustomers(customersData.customers || [])
      setOrganizations(organizationsData.organizations || [])
    } catch (err) {
      console.error('Failed to load Super Admin data:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Super Admin data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setCreating(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          organization_name: organizationName.trim(),
          admin_name: adminName.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail || `Customer creation failed: ${response.status}`
        )
      }

      setMessage(
        `Customer "${data.organization?.name || organizationName}" created successfully.`
      )

      setOrganizationName('')
      setAdminName('')
      setEmail('')
      setUsername('')
      setPassword('')

      await loadData()
    } catch (err) {
      console.error('Failed to create customer:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create customer.'
      )
    } finally {
      setCreating(false)
    }
  }

  async function toggleCustomer(customer: Customer) {
    setError('')
    setMessage('')

    try {
      const nextStatus = !customer.is_active

      const response = await fetch(
        `${API_BASE_URL}/api/customers/${encodeURIComponent(
          customer.id
        )}/status?is_active=${nextStatus}`,
        {
          method: 'PATCH',
          headers: getHeaders(),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail || `Status update failed: ${response.status}`
        )
      }

      setMessage(
        `${customer.username} is now ${nextStatus ? 'active' : 'inactive'}.`
      )

      await loadData()
    } catch (err) {
      console.error('Failed to update customer status:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update customer status.'
      )
    }
  }

  const activeOrganizations = organizations.filter(
    (organization) => organization.is_active
  ).length

  const activeCustomers = customers.filter(
    (customer) => customer.is_active
  ).length

  return (
    <section
      id="super-admin"
      className="panel"
      style={{ marginTop: '24px' }}
    >
      <div className="panel-header">
        <div>
          <h3>Super Admin Control Center</h3>
          <span>
            Manage SentinelX organizations and customer administrator accounts
          </span>
        </div>

        <strong style={{ fontSize: '12px', opacity: 0.65 }}>
          PLATFORM ADMIN
        </strong>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '9px',
            border: '1px solid rgba(255,80,80,0.25)',
            background: 'rgba(255,80,80,0.08)',
          }}
        >
          ? {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '9px',
            border: '1px solid rgba(66,133,244,0.25)',
            background: 'rgba(66,133,244,0.08)',
          }}
        >
          ? {message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {[
          ['Organizations', organizations.length],
          ['Active Organizations', activeOrganizations],
          ['Customer Admins', customers.length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            style={{
              padding: '18px',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: '11px', opacity: 0.55 }}>
              {String(label).toUpperCase()}
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: '28px',
                marginTop: '7px',
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(0, 1.2fr)',
          gap: '18px',
        }}
      >
        <div
          style={{
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
          }}
        >
          <h4 style={{ marginTop: 0 }}>Create Customer</h4>

          <form onSubmit={createCustomer}>
            {[
              ['Organization Name', organizationName, setOrganizationName, 'ABC Academy'],
              ['Admin Name', adminName, setAdminName, 'Academy Admin'],
              ['Email', email, setEmail, 'admin@academy.com'],
              ['Username', username, setUsername, 'academyadmin'],
            ].map(([label, value, setter, placeholder]) => (
              <label
                key={String(label)}
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '12px',
                }}
              >
                {String(label)}

                <input
                  value={String(value)}
                  onChange={(event) =>
                    (setter as React.Dispatch<React.SetStateAction<string>>)(
                      event.target.value
                    )
                  }
                  placeholder={String(placeholder)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: '6px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: '#0b1220',
                    color: 'inherit',
                  }}
                />
              </label>
            ))}

            <label
              style={{
                display: 'block',
                marginBottom: '14px',
                fontSize: '12px',
              }}
            >
              Temporary Password

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginTop: '6px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: '#0b1220',
                  color: 'inherit',
                }}
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: 0,
                borderRadius: '8px',
                background: '#4285F4',
                color: '#fff',
                fontWeight: 700,
                cursor: creating ? 'wait' : 'pointer',
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? 'Creating...' : '+ Create Customer'}
            </button>
          </form>
        </div>

        <div
          style={{
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <h4 style={{ margin: 0 }}>Customers</h4>

            <span style={{ fontSize: '12px', opacity: 0.55 }}>
              {activeCustomers} active
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
              No customers found.
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '650px',
              }}
            >
              <thead>
                <tr>
                  {['Organization', 'Username', 'Email', 'Status', 'Action'].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: 'left',
                          padding: '10px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          opacity: 0.5,
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                      {customer.organization_name}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      {customer.username}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      {customer.email}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: customer.is_active
                            ? 'rgba(60,200,120,0.12)'
                            : 'rgba(255,80,80,0.12)',
                        }}
                      >
                        {customer.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <button
                        onClick={() => toggleCustomer(customer)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '7px',
                          border:
                            '1px solid rgba(255,255,255,0.10)',
                          background: 'transparent',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        {customer.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
