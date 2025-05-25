function initializeOrdersTable() {
  let table = $("#ordersTable").DataTable({
    retrieve: true,
    responsive: true,
    processing: true,
    serverSide: false,
    ajax: {
      url: "/api/orders/",
      dataSrc: "data",
    },
    columns: [
      { data: "id" },
      {
        data: "patient_name",
        render: function (data) {
          return data || "N/A";
        },
      },
      {
        data: "prescriptions",
        render: function (data) {
          return data ? data.length : 0;
        },
      },
      {
        data: "status",
        render: function (data) {
          return data
            ? `<span class="badge bg-${data.toLowerCase()}">${data}</span>`
            : '<span class="badge bg-secondary">N/A</span>';
        },
      },
      {
        data: "created_at",
        render: function (data) {
          return data ? new Date(data).toLocaleDateString() : "N/A";
        },
      },
      {
        data: null,
        render: function (data, type, row) {
          let buttons = `<button class="btn btn-sm btn-primary view-order" data-id="${row.id}">View</button>`;
          if (row.status === "pending") {
            buttons += ` <button class="btn btn-sm btn-danger cancel-order" data-id="${row.id}">Cancel</button>`;
          }
          return buttons;
        },
      },
    ],
    order: [[4, "desc"]],
    language: {
      processing: "Loading orders...",
      zeroRecords: "No orders found",
      emptyTable: "No orders available",
    },
  });

  // Function to format date
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Handle view order button click
  $("#ordersTable").on("click", ".view-order", function () {
    const orderId = $(this).data("id");

    // Show loading state in modal
    $("#modal-order-id").text("Loading...");
    $("#modal-order-date").text("Loading...");
    $("#modal-order-status").text("Loading...");
    $("#order-items-list").html(
      '<tr><td colspan="4" class="text-center">Loading...</td></tr>'
    );

    // Show the modal
    $("#orderDetailsModal").modal("show");

    // Fetch order details
    $.ajax({
      url: `/api/orders/${orderId}/`,
      method: "GET",
      success: function (response) {
        // Update modal with order details
        $("#modal-order-id").text(response.id);
        $("#modal-order-date").text(formatDate(response.created_at));
        $("#modal-order-status").html(
          response.status
            ? `<span class="badge bg-${response.status.toLowerCase()}">${
                response.status
              }</span>`
            : '<span class="badge bg-secondary">N/A</span>'
        );

        // Clear and populate prescriptions table
        let prescriptionsHtml = "";
        response.prescriptions.forEach(function (prescription) {
          const status = prescription.status || "N/A";
          prescriptionsHtml += `
            <tr>
              <td>${prescription.patient_name || "N/A"}</td>
              <td>${prescription.orthotic_type || "Custom"}</td>
              <td><span class="badge bg-${status.toLowerCase()}">${status}</span></td>
              <td>
                <a href="/prescriptions/${
                  prescription.id
                }/" class="btn btn-primary btn-sm" target="_blank">
                  <i class="fas fa-eye me-1"></i> View
                </a>
              </td>
            </tr>
          `;
        });
        $("#order-items-list").html(
          prescriptionsHtml ||
            '<tr><td colspan="4" class="text-center">No prescriptions found</td></tr>'
        );

        // Handle notes
        if (response.notes) {
          $("#modal-notes").html(response.notes.replace(/\n/g, "<br>"));
          $("#modal-notes-section").show();
        } else {
          $("#modal-notes-section").hide();
        }

        // Show/hide cancel button based on order status
        if (response.status === "pending") {
          $("#modalCancelOrderBtn").show();
          $("#modalCancelOrderBtn").data("order-id", response.id);
        } else {
          $("#modalCancelOrderBtn").hide();
        }
      },
      error: function (xhr) {
        // Handle error
        $("#orderDetailsModal").modal("hide");
        alert(
          "Error loading order details: " +
            (xhr.responseJSON?.error || "Unknown error")
        );
      },
    });
  });

  // Handle cancel order button click (both in table and modal)
  $("#ordersTable, #orderDetailsModal").on(
    "click",
    ".cancel-order, #modalCancelOrderBtn",
    function () {
      const orderId = $(this).data("id") || $(this).data("order-id");
      if (confirm("Are you sure you want to cancel this order?")) {
        $.ajax({
          url: `/api/orders/${orderId}/cancel/`,
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
          success: function () {
            table.ajax.reload();
            $("#orderDetailsModal").modal("hide");
          },
          error: function (xhr) {
            alert(
              "Error cancelling order: " +
                (xhr.responseJSON?.error || "Unknown error")
            );
          },
        });
      }
    }
  );
}

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
