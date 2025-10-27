import { cogneeApi } from '@/lib/api/cognee-api-client'

export async function setupInitialPermissions() {
  try {
    // Check if tenant already exists (via API call or localStorage flag)
    const initialized = localStorage.getItem('cognee_permissions_initialized')
    
    if (initialized) {
      return
    }
    
    // 1. Create tenant "imeso-ki"
    const tenantResponse = await cogneeApi.permissions.createTenant(
      'imeso-ki',
      'imeso KI Organisation'
    )
    const tenantId = tenantResponse.data.id
    
    // 2. Create roles
    const adminRoleResponse = await cogneeApi.permissions.createRole(
      'admin',
      tenantId,
      'Administrator mit vollen Rechten'
    )
    
    const userRoleResponse = await cogneeApi.permissions.createRole(
      'user',
      tenantId,
      'Standard-Nutzer mit eingeschränkten Rechten'
    )
    
    // 3. Save to localStorage
    localStorage.setItem('cognee_permissions_initialized', 'true')
    localStorage.setItem('cognee_tenant_id', tenantId)
    localStorage.setItem('cognee_admin_role_id', adminRoleResponse.data.id)
    localStorage.setItem('cognee_user_role_id', userRoleResponse.data.id)
    
  } catch (error) {
    // Don't throw - allow app to continue
  }
}

