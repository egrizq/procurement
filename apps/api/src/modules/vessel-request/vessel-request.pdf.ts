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
 * Get status color hex for display
 */
function getStatusColor(status: string): string {
	switch (status) {
		case 'Approved':
		case 'Completed':
			return '#10b981'; // Emerald
		case 'Rejected':
			return '#ef4444'; // Red
		case 'Waiting':
		case 'Pending':
			return '#f59e0b'; // Yellow/Amber
		default:
			return '#6b7280'; // Gray
	}
}

/**
 * Generate PDF stream for a vessel request
 */
export async function generateVesselRequestPdf(request: any): Promise<Buffer> {
	const tableBody: any[] = [
		[
			{ text: '#', style: 'tableHeader', alignment: 'center' },
			{ text: 'Item Name & Code', style: 'tableHeader' },
			{ text: 'Qty Requested', style: 'tableHeader', alignment: 'center' },
			{ text: 'Qty Approved', style: 'tableHeader', alignment: 'center' },
			{ text: 'Unit', style: 'tableHeader', alignment: 'center' },
		],
	];

	const items = request.vesselRequestItems || [];
	items.forEach((item: any, idx: number) => {
		const rowBg = idx % 2 === 1 ? '#fcfcfc' : '#ffffff';
		tableBody.push([
			{ text: (idx + 1).toString(), alignment: 'center', fillColor: rowBg },
			{
				text: [
					{ text: item.item?.name || 'Unknown Item', bold: true },
					item.item?.itemCode ? `\nCode: ${item.item.itemCode}` : '',
					item.justification ? `\nJustification: ${item.justification}` : '',
					item.staffJustification ? `\nStaff Justification: ${item.staffJustification}` : '',
				],
				fillColor: rowBg,
			},
			{ text: item.qtyRequested.toString(), alignment: 'center', fillColor: rowBg },
			{ text: item.qtyApproved !== null ? item.qtyApproved.toString() : '-', alignment: 'center', fillColor: rowBg },
			{ text: item.unit || '-', alignment: 'center', fillColor: rowBg },
		]);
	});

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
						text: 'VESSEL REQUEST',
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
							{ text: 'Request Code: ', bold: true },
							{ text: request.requestCode, fontSize: 13, bold: true, color: '#1e3a8a' },
						],
					},
					{ text: `Request Date: ${formatDate(request.requestDate)}`, margin: [0, 4, 0, 4], bold: true },
					{ text: `Vessel: ${request.vessel?.name || '-'}`, margin: [0, 0, 0, 4], bold: true },
					{ text: 'Requested By: marine.com', margin: [0, 0, 0, 0] },
				],
				style: 'metadataContainer',
			},

			// Justification (if any)
			request.justification
				? {
						stack: [
							{ text: 'Justification / Description:', style: 'sectionHeader' },
							{
								text: request.justification,
								style: 'justificationText',
							},
						],
						margin: [0, 15, 0, 15],
				  }
				: { text: '', margin: [0, 10, 0, 0] },

			// Items List Header
			{ text: 'Requested Items', style: 'sectionHeader', margin: [0, 5, 0, 5] },

			// Items Table
			{
				style: 'tableExample',
				table: {
					headerRows: 1,
					widths: [20, '*', 80, 80, 50],
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
							{ text: 'Requested By:', margin: [0, 40, 0, 40], alignment: 'center' },
							{ text: '___________________________', alignment: 'center', margin: [0, 0, 0, 8] },
							{ text: 'marine.com', fontSize: 10, alignment: 'center', bold: true },
							{ text: 'Date: ' + formatDate(request.requestDate), fontSize: 9, alignment: 'center', color: '#6b7280' },
						],
					},
					{
						width: '50%',
						stack: [
							{ text: 'Approved/Reviewed By:', margin: [0, 40, 0, 40], alignment: 'center' },
							{ text: '___________________________', alignment: 'center', margin: [0, 0, 0, 8] },
							{ text: request.status === 'Approved' ? 'Logistics Office / Staff' : 'Pending Review', fontSize: 10, alignment: 'center', bold: true },
							{ text: request.reviewedAt ? 'Date: ' + formatDate(request.reviewedAt) : 'Date: ________________', fontSize: 9, alignment: 'center', color: '#6b7280' },
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
