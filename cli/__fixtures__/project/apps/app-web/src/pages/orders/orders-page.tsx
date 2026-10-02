/** SOURCE OF TRUTH: OrdersPage.
 * WHAT: lists the organization's orders in the dashboard.
 * WHY: the operator follows orders here and customers create them at checkout, so the empty state does not invite to create (ADR-0001).
 * WHERE: mounted by the router at /orders; reads the orders query from the API.
 * Only orders of the session's organization.
 */
export function OrdersPage() {
  return null;
}
