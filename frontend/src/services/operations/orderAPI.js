import { toast } from "react-hot-toast"
import { apiConnector } from "../apiConnector"
import { adminEndpoints } from "../apis"

export const getAllOrders = async (token) => {
  try {
    const response = await apiConnector(
      "GET",
      adminEndpoints.GET_ALL_ORDERS_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    )
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    return response.data.orders
  } catch (error) {
    console.error("GET_ALL_ORDERS_API API ERROR............", error)
    toast.error(error.response?.data?.message || "Could not fetch orders")
    return []
  }
}

export const deleteOrder = async (token, orderId) => {
  try {
    const response = await apiConnector(
      "DELETE",
      adminEndpoints.DELETE_ORDER_API.replace(":orderId", orderId),
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    )
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success("Order deleted successfully")
    return true
  } catch (error) {
    console.error("DELETE_ORDER_API API ERROR............", error)
    toast.error(error.response?.data?.message || "Could not delete order")
    return false
  }
}

export const updateOrderStatus = async (token, orderId, status) => {
  try {
    const response = await apiConnector(
      "PATCH",
      adminEndpoints.UPDATE_ORDER_STATUS_API.replace(":orderId", orderId),
      { status },
      {
        Authorization: `Bearer ${token}`,
      }
    )
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success("Order status updated successfully")
    return true
  } catch (error) {
    console.error("UPDATE_ORDER_STATUS_API API ERROR............", error)
    toast.error(error.response?.data?.message || "Could not update order status")
    return false
  }
}

export const generateOrdersPDF = async (token) => {
  const toastId = toast.loading("Generating PDF...")
  try {
    const response = await apiConnector(
      "GET",
      adminEndpoints.GENERATE_ORDERS_PDF_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      },
      null,
      { responseType: "blob" }
    )
    
    // Check if response is actually a blob
    if (response.data instanceof Blob && response.data.size > 0) {
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: "application/pdf" })
      
      // Create a link element, click it, and remove it
      const fileURL = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = fileURL
      link.download = `orders-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(fileURL)
      document.body.removeChild(link)
      
      toast.dismiss(toastId)
      toast.success("PDF downloaded successfully")
      return true
    } else {
      throw new Error("Invalid PDF response received")
    }
  } catch (error) {
    console.error("GENERATE_ORDERS_PDF_API API ERROR............", error)
    toast.dismiss(toastId)
    
    // Handle different types of errors
    if (error.response?.status === 401) {
      toast.error("Unauthorized. Please login again.")
    } else if (error.response?.status === 403) {
      toast.error("Access denied. Admin privileges required.")
    } else if (error.response?.status === 500) {
      toast.error("Server error while generating PDF. Please try again.")
    } else {
      toast.error(error.message || "Could not generate PDF")
    }
    return false
  }
}
