import { createRequire } from "module";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

const require = createRequire(import.meta.url);
const pdfMake = require("pdfmake");

pdfMake.setFonts({
	Helvetica: {
		normal: "Helvetica",
		bold: "Helvetica-Bold",
		italics: "Helvetica-Oblique",
		bolditalics: "Helvetica-BoldOblique",
	},
});

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

/**
 * Generates a Request for Quotation document for the vendors recorded in an MOC.
 * The staff downloads this document and sends it through the agreed external
 * communication channel before vendor quotations are entered into the system.
 */
export async function generateRequestForQuotationPdf(moc: any): Promise<Buffer> {
	const item = moc.vesselRequestItem?.item;
	const vendors = moc.mocVendors ?? [];

	const vendorRows: any[] = [
		[
			{ text: "No.", style: "tableHeader", alignment: "center" },
			{ text: "Vendor", style: "tableHeader" },
			{ text: "Kontak", style: "tableHeader" },
		],
		...vendors.map((entry: any, index: number) => {
			const vendor = entry.vendor ?? {};
			const contact = [vendor.email, vendor.phone].filter(Boolean).join(" | ") || "-";
			return [
				{ text: String(index + 1), alignment: "center" },
				vendor.name ?? "-",
				contact,
			];
		}),
	];

	const docDefinition: TDocumentDefinitions = {
		pageMargins: [40, 38, 40, 48],
		content: [
			{
				columns: [
					{ text: "PROCUREMENT SYSTEM", bold: true, fontSize: 13, color: "#1e3a8a" },
					{ text: "REQUEST FOR QUOTATION", bold: true, fontSize: 15, alignment: "right" },
				],
			},
			{
				canvas: [
					{ type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 1.5, lineColor: "#1e3a8a" } as any,
				],
				margin: [0, 0, 0, 18],
			},
			{
				text: `Nomor RFQ: RFQ-MOC-${moc.id}`,
				fontSize: 12,
				bold: true,
				color: "#1e3a8a",
			},
			{ text: `Tanggal: ${formatDate(moc.createdAt)}`, margin: [0, 4, 0, 14] },
			{
				text: "Dengan hormat, kami mengundang vendor berikut untuk menyampaikan penawaran atas kebutuhan barang di bawah ini.",
				margin: [0, 0, 0, 12],
			},
			{ text: "Detail Kebutuhan", style: "sectionHeader" },
			{
				table: {
					widths: [135, "*"],
					body: [
						[{ text: "Referensi Request", bold: true }, moc.vesselRequest?.requestCode ?? "-"],
						[{ text: "Kapal", bold: true }, moc.vesselRequest?.vessel?.name ?? "-"],
						[{ text: "Barang", bold: true }, item?.name ?? "-"],
						[{ text: "Kode Barang", bold: true }, item?.itemCode ?? "-"],
						[{ text: "Jumlah", bold: true }, `${moc.vesselRequestItem?.qtyApproved ?? moc.vesselRequestItem?.qtyRequested ?? "-"} ${moc.vesselRequestItem?.unit ?? ""}`],
					],
				},
				layout: "lightHorizontalLines",
				margin: [0, 0, 0, 14],
			},
			{ text: "Daftar Vendor Tujuan", style: "sectionHeader" },
			{
				table: { headerRows: 1, widths: [42, "*", 180], body: vendorRows },
				layout: "lightHorizontalLines",
				margin: [0, 0, 0, 14],
			},
			{
				text: "Mohon menyampaikan penawaran yang mencantumkan harga satuan, ketersediaan jumlah, diskon, masa garansi, dan ketentuan lainnya. Penawaran diterima oleh Staff Procurement melalui kanal komunikasi yang disepakati.",
				italics: true,
				color: "#4b5563",
			},
			{
				columns: [
					{ width: "55%", text: "" },
					{
						width: "45%",
						stack: [
							{ text: "Staff Procurement,", alignment: "center", margin: [0, 34, 0, 38] },
							{ text: "____________________________", alignment: "center" },
							{ text: moc.user?.fullName ?? "", alignment: "center", bold: true, margin: [0, 7, 0, 0] },
						],
					},
				],
				margin: [0, 14, 0, 0],
			},
		],
		footer: (currentPage: number, pageCount: number) => ({
			text: `RFQ-MOC-${moc.id} | Halaman ${currentPage} dari ${pageCount}`,
			alignment: "center",
			fontSize: 8,
			color: "#6b7280",
			margin: [0, 10, 0, 0],
		}),
		defaultStyle: { font: "Helvetica", fontSize: 10, color: "#374151" },
		styles: {
			sectionHeader: { fontSize: 11, bold: true, color: "#1e3a8a", margin: [0, 5, 0, 5] },
			tableHeader: { bold: true, color: "#111827", fillColor: "#e5e7eb" },
		},
	};

	return pdfMake.createPdf(docDefinition).getBuffer();
}
