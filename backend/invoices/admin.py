from django.contrib import admin
from .models import Invoice, InvoiceItem

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

class InvoiceAdmin(admin.ModelAdmin):
    inlines = [InvoiceItemInline]
    list_display = ('invoice_number', 'order', 'amount', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'due_date')
    search_fields = ('invoice_number', 'order__id', 'notes')

admin.site.register(Invoice, InvoiceAdmin)
admin.site.register(InvoiceItem)