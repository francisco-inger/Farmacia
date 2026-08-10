/**
 * Multi-Branch API Gateway Router & Auth Manager
 */

export class ApiGateway {
  constructor() {
    this.branches = [
      { branch_id: "b1010000-0000-4000-8000-000000000001", name: "Sucursal Santo Domingo Centro", code: "SD-CTR", is_active: true },
      { branch_id: "b1020000-0000-4000-8000-000000000002", name: "Sucursal Santiago Monumento", code: "STI-MON", is_active: true },
      { branch_id: "b1030000-0000-4000-8000-000000000003", name: "Sucursal Punta Cana Downtown", code: "PUJ-DWT", is_active: true }
    ];

    this.currentBranch = this.branches[0];
    this.modulesRegistry = [
      { name: "POS (Punto de Venta)", path: "/api/v1/pos", status: "healthy", owner: "Adrian Felipe" },
      { name: "Inventario", path: "/api/v1/inventory", status: "healthy", owner: "Ana María" },
      { name: "Facturación", path: "/api/v1/invoicing", status: "healthy", owner: "Anyelo" },
      { name: "Servicios Clínicos", path: "/api/v1/services", status: "healthy", owner: "Ambiorix" },
      { name: "Recursos Humanos", path: "/api/v1/hr", status: "healthy", owner: "Daniel" },
      { name: "Chatbot WhatsApp", path: "/api/v1/chatbot", status: "healthy", owner: "Héctor" },
      { name: "Analytics & BI", path: "/api/v1/analytics", status: "healthy", owner: "Kendry" },
      { name: "Seguridad & Audit", path: "/api/v1/security", status: "healthy", owner: "Luisa" },
      { name: "Integraciones ARS", path: "/api/v1/integrations", status: "healthy", owner: "Rafi" },
      { name: "QA & Testing", path: "/api/v1/qa", status: "healthy", owner: "Diego" }
    ];
  }

  getBranches() {
    return this.branches;
  }

  getCurrentBranch() {
    return this.currentBranch;
  }

  setBranch(branchId) {
    const found = this.branches.find(b => b.branch_id === branchId);
    if (found) {
      this.currentBranch = found;
    }
    return this.currentBranch;
  }

  getModulesRegistry() {
    return this.modulesRegistry;
  }

  validateRequest(token, modulePath) {
    if (!token) {
      return { success: false, statusCode: 401, error: "Unauthorized: Missing branch access token" };
    }
    const targetModule = this.modulesRegistry.find(m => m.path === modulePath);
    if (!targetModule) {
      return { success: false, statusCode: 404, error: "Route not found in API Gateway" };
    }
    return { success: true, statusCode: 200, module: targetModule, branch: this.currentBranch };
  }
}
