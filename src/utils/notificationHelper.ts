import { API_BASE_URL } from "../config/config";

export interface NotificationPayload {
  user_id: string;
  title: string;
  message?: string;
  link?: string;
  type?: string;
  metadata?: any;
}

/**
 * Create a notification for a specific user
 * @param notification The notification payload
 * @param token Optional Bearer token for authentication
 * @returns Promise<void>
 */
export async function createNotification(
  notification: NotificationPayload,
  token?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/create`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.statusText}`);
    }

    console.log("Notification created successfully");
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create a product request notification
 */
export async function createProductRequestNotification(
  userId: string,
  requestId: bigint,
  requesterName: string,
  itemCount: number,
  totalQuantity: number,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "New Product Request",
      message: `Product request #${requestId} from ${requesterName} with ${itemCount} item(s) (${totalQuantity} units total)`,
      link: "/pending_request",
      type: "product_request",
      metadata: {
        request_id: requestId,
        item_count: itemCount,
        total_quantity: totalQuantity,
        requester_name: requesterName,
      },
    },
    token
  );
}

/**
 * Create a low stock alert notification
 */
export async function createLowStockNotification(
  userId: string,
  productName: string,
  currentStock: number,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "Low Stock Alert",
      message: `${productName} stock is running low (${currentStock} units remaining)`,
      link: "/inventory",
      type: "alert",
      metadata: {
        product_name: productName,
        current_stock: currentStock,
        alert_type: "low_stock",
      },
    },
    token
  );
}

/**
 * Create a stock transfer notification
 */
export async function createStockTransferNotification(
  userId: string,
  fromBranch: string,
  toBranch: string,
  quantity: number,
  productName: string,
  transferId: string,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "Stock Transfer Notification",
      message: `${quantity} units of ${productName} transferred from ${fromBranch} to ${toBranch}`,
      link: "/transfers",
      type: "transfer",
      metadata: {
        transfer_id: transferId,
        from_branch: fromBranch,
        to_branch: toBranch,
        quantity,
        product_name: productName,
      },
    },
    token
  );
}

/**
 * Create an out of stock notification
 */
export async function createOutOfStockNotification(
  userId: string,
  productName: string,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "Out of Stock",
      message: `${productName} is now out of stock`,
      link: "/inventory",
      type: "alert",
      metadata: {
        product_name: productName,
        alert_type: "out_of_stock",
      },
    },
    token
  );
}

/**
 * Create a request approved notification
 */
export async function createRequestApprovedNotification(
  userId: string,
  requestId: bigint,
  approverName: string,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "Product Request Approved",
      message: `Your product request #${requestId} has been approved by ${approverName}`,
      link: "/my_requests",
      type: "product_request",
      metadata: {
        request_id: requestId,
        approver_name: approverName,
      },
    },
    token
  );
}

/**
 * Create a request rejected notification
 */
export async function createRequestRejectedNotification(
  userId: string,
  requestId: bigint,
  rejecterName: string,
  reason?: string,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title: "Product Request Rejected",
      message: `Your product request #${requestId} has been rejected by ${rejecterName}${
        reason ? `: ${reason}` : ""
      }`,
      link: "/my_requests",
      type: "product_request",
      metadata: {
        request_id: requestId,
        rejecter_name: rejecterName,
        reason: reason || null,
      },
    },
    token
  );
}

/**
 * Create a general system notification
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  message?: string,
  link?: string,
  metadata?: any,
  token?: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      title,
      message,
      link,
      type: "general",
      metadata,
    },
    token
  );
}
