import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfMake = require('pdfmake');

import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Define built-in standard PDF 14 fonts
const fonts = {
	Helvetica: {
		normal: 'Helvetica',
		bold: 'Helvetica-Bold',
		italics: 'Helvetica-Oblique',
		bolditalics: 'Helvetica-BoldOblique',
	},
};

pdfMake.setFonts(fonts);

/**
 * Format date helper
 */
function formatDate(date: Date | string | null): string {
	if (!date) return '-';
	const d = new Date(date);
	if (isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Format price helper
 */
function formatPrice(num: number | string | null): string {
	if (!num && num !== 0) return '-';
	return 'Rp ' + Number(num).toLocaleString('id-ID');
}

/**
 * Get status color hex for display
 */
function getStatusColor(status: string): string {
	switch (status) {
		case 'Approved':
		case 'Auto Approved':
			return '#10b981'; // Emerald
		case 'Rejected':
			return '#ef4444'; // Red
		case 'Pending Approval':
			return '#f59e0b'; // Yellow/Amber
		default:
			return '#6b7280'; // Gray
	}
}

/**
 * Generate PDF stream for a purchase order
 */
export async function generatePurchaseOrderPdf(po: any): Promise<Buffer> {
	const tableBody: any[] = [
		[
			{ text: '#', style: 'tableHeader', alignment: 'center' },
			{ text: 'Item Name & Code', style: 'tableHeader' },
			{ text: 'Qty', style: 'tableHeader', alignment: 'center' },
			{ text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
			{ text: 'Total Amount', style: 'tableHeader', alignment: 'right' },
		],
		[
			{ text: '1', alignment: 'center', fillColor: '#ffffff' },
			{
				text: [
					{ text: po.vesselRequestItem?.item?.name || 'Unknown Item', bold: true },
					po.vesselRequestItem?.item?.itemCode ? `\nCode: ${po.vesselRequestItem.item.itemCode}` : '',
				],
				fillColor: '#ffffff',
			},
			{ text: `${po.qty} ${po.vesselRequestItem?.unit || 'Pcs'}`, alignment: 'center', fillColor: '#ffffff' },
			{ text: formatPrice(po.unitPrice), alignment: 'right', fillColor: '#ffffff' },
			{ text: formatPrice(po.totalAmount), alignment: 'right', fillColor: '#ffffff' },
		],
	];

	const docDefinition: TDocumentDefinitions = {
		content: [
			// Header Grid
			{
				columns: [
					{
						text: 'PROCUREMENT SYSTEM',
						fontSize: 14,
						bold: true,
						color: '#1e3a8a',
					},
					{
						text: 'PURCHASE ORDER',
						fontSize: 16,
						bold: true,
						alignment: 'right',
						color: '#111827',
					},
				],
			},
			{
				canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1.5, lineColor: '#1e3a8a' } as any],
				margin: [0, 0, 0, 15],
			},

			// Metadata Block
			{
				stack: [
					{
						text: [
							{ text: 'PO Number: ', bold: true },
							{ text: po.poNumber, fontSize: 13, bold: true, color: '#1e3a8a' },
						],
					},
					{
						text: [
							{ text: 'Status: ', bold: true },
							{ text: po.status, color: getStatusColor(po.status), bold: true },
						],
						margin: [0, 4, 0, 4],
					},
					{ text: `PO Date: ${formatDate(po.createdAt)}`, margin: [0, 0, 0, 4] },
					{ text: `MOC Ref Code: ${po.moc?.vesselRequest?.requestCode || '-'}`, margin: [0, 0, 0, 4] },
					{ text: `Vessel: ${po.moc?.vesselRequest?.vessel?.name || '-'}`, margin: [0, 0, 0, 0] },
				],
				style: 'metadataContainer',
			},

			// Vendor Details
			{
				stack: [
					{ text: 'Vendor Details', style: 'sectionHeader' },
					{ text: `Vendor Name: ${po.vendor?.name || '-'}`, bold: true, fontSize: 11 },
				],
				margin: [0, 15, 0, 10],
			},

			// Notes (if any)
			po.notes
				? {
						stack: [
							{ text: 'Catatan / Notes:', style: 'sectionHeader' },
							{
								text: po.notes,
								style: 'justificationText',
							},
						],
						margin: [0, 5, 0, 15],
				  }
				: { text: '', margin: [0, 5, 0, 0] },

			// Items List Header
			{ text: 'Order Details', style: 'sectionHeader', margin: [0, 5, 0, 5] },

			// Items Table
			{
				style: 'tableExample',
				table: {
					headerRows: 1,
					widths: [30, '*', 60, 100, 120],
					body: tableBody,
				},
				layout: {
					hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
					vLineWidth: () => 0.5,
					hLineColor: () => '#d1d5db',
					vLineColor: () => '#e5e7eb',
				},
			},

			// Signature section
			{
				columns: [
					{
						width: '50%',
						stack: [
							{ text: 'Created By:', margin: [0, 40, 0, 40], alignment: 'center' },
							{ text: '___________________________', alignment: 'center', margin: [0, 0, 0, 8] },
							{ text: po.createdByUser?.fullName || 'Staff / Buyer', fontSize: 10, alignment: 'center', bold: true },
							{ text: 'Date: ' + formatDate(po.createdAt), fontSize: 9, alignment: 'center', color: '#6b7280' },
						],
					},
					{
						width: '50%',
						stack: [
							{ text: 'Approved By:', margin: [0, 40, 0, 40], alignment: 'center' },
							{ text: '___________________________', alignment: 'center', margin: [0, 0, 0, 8] },
							{
								text:
									po.status === 'Approved' || po.status === 'Auto Approved'
										? po.approvedByUser?.fullName || 'Manager / System'
										: 'Pending Approval',
								fontSize: 10,
								alignment: 'center',
								bold: true,
							},
							{
								text:
									po.status === 'Approved' || po.status === 'Auto Approved'
										? 'Date: ' + formatDate(po.approvedAt || po.createdAt)
										: 'Date: ________________',
								fontSize: 9,
								alignment: 'center',
								color: '#6b7280',
							},
						],
					},
				],
				margin: [0, 50, 0, 0],
			},
		],
		footer: (currentPage: number, pageCount: number) => {
			return {
				text: `Page ${currentPage} of ${pageCount}`,
				alignment: 'center',
				fontSize: 9,
				color: '#9ca3af',
				margin: [0, 10, 0, 0],
			};
		},
		defaultStyle: {
			font: 'Helvetica',
			fontSize: 10,
			color: '#374151',
		},
		styles: {
			metadataContainer: {
				fontSize: 10.5,
			},
			sectionHeader: {
				fontSize: 12,
				bold: true,
				color: '#1e3a8a',
				margin: [0, 10, 0, 5],
			},
			justificationText: {
				italics: true,
				color: '#4b5563',
				background: '#f9fafb',
				margin: [5, 5, 5, 5],
			},
			tableHeader: {
				bold: true,
				fontSize: 10,
				color: '#111827',
				fillColor: '#f3f4f6',
			},
			tableExample: {
				margin: [0, 5, 0, 15],
			},
		},
	};

	return pdfMake.createPdf(docDefinition).getBuffer();
}
