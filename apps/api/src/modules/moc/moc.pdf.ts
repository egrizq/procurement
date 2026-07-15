import { createRequire } from "module";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type { SawBreakdown } from "./moc.scoring.ts";

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

const formatNumber = (value: number | string) =>
	Number(value).toLocaleString("id-ID", { maximumFractionDigits: 2 });

const formatDate = (value: Date | string) =>
	new Date(value).toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

export async function generateMocRecommendationPdf(
	moc: any,
	breakdown: SawBreakdown,
	decision: any,
): Promise<Buffer> {
	const vendorMatrix = JSON.parse(decision.vendorMatrixSnapshot) as any[];
	const matrixByVendor = new Map(
		vendorMatrix.map((vendor) => [vendor.vendorId, vendor]),
	);
	const selected = breakdown.vendors.find(
		(vendor) => vendor.vendorId === decision.selectedVendorId,
	);
	const recommended = breakdown.vendors.find(
		(vendor) => vendor.vendorId === decision.recommendedVendorId,
	);

	const criteriaBody: any[] = [
		[
			{ text: "Kriteria", style: "tableHeader" },
			{ text: "Jenis", style: "tableHeader" },
			{ text: "Bobot", style: "tableHeader", alignment: "right" },
			{ text: "Konversi", style: "tableHeader" },
		],
		...breakdown.criteria.map((criterion) => [
			criterion.name,
			criterion.type === "cost" ? "Cost" : "Benefit",
			{ text: `${formatNumber(criterion.weight * 100)}%`, alignment: "right" },
			criterion.useScale ? "Skala 1-5" : "Nilai langsung",
		]),
	];

	const rankingBody: any[] = [
		[
			{ text: "Rank", style: "tableHeader", alignment: "center" },
			{ text: "Vendor", style: "tableHeader" },
			{ text: "Harga", style: "tableHeader", alignment: "right" },
			{ text: "Qty", style: "tableHeader", alignment: "right" },
			{ text: "Garansi", style: "tableHeader", alignment: "right" },
			{ text: "Diskon", style: "tableHeader", alignment: "right" },
			{ text: "Skor", style: "tableHeader", alignment: "right" },
		],
		...breakdown.vendors.map((vendor) => {
			const raw = matrixByVendor.get(vendor.vendorId) ?? {};
			return [
				{ text: String(vendor.rank), alignment: "center", bold: vendor.rank === 1 },
				{ text: vendor.vendorName, bold: vendor.rank === 1 },
				{ text: `Rp ${formatNumber(raw.unitPrice ?? 0)}`, alignment: "right" },
				{ text: formatNumber(raw.availableQty ?? 0), alignment: "right" },
				{ text: `${formatNumber(raw.warranty ?? 0)} bln`, alignment: "right" },
				{ text: `${formatNumber(raw.discount ?? 0)}%`, alignment: "right" },
				{
					text: `${formatNumber(vendor.sawScore * 100)}%`,
					alignment: "right",
					bold: vendor.rank === 1,
					color: vendor.rank === 1 ? "#047857" : "#111827",
				},
			];
		}),
	];

	const docDefinition: TDocumentDefinitions = {
		pageOrientation: "landscape",
		pageMargins: [36, 32, 36, 42],
		content: [
			{
				columns: [
					{
						text: "PROCUREMENT SYSTEM",
						fontSize: 13,
						bold: true,
						color: "#1e3a8a",
					},
					{
						text: "SURAT REKOMENDASI PEMILIHAN VENDOR",
						fontSize: 15,
						bold: true,
						alignment: "right",
					},
				],
			},
			{
				canvas: [
					{
						type: "line",
						x1: 0,
						y1: 6,
						x2: 770,
						y2: 6,
						lineWidth: 1.5,
						lineColor: "#1e3a8a",
					} as any,
				],
				margin: [0, 0, 0, 14],
			},
			{
				columns: [
					{
						width: "50%",
						stack: [
							{ text: `MOC: MOC-${moc.id}`, bold: true },
							`Request: ${moc.vesselRequest?.requestCode ?? "-"}`,
							`Vessel: ${moc.vesselRequest?.vessel?.name ?? "-"}`,
						],
					},
					{
						width: "50%",
						stack: [
							`Item: ${moc.vesselRequestItem?.item?.name ?? "-"}`,
							`Qty disetujui: ${moc.vesselRequestItem?.qtyApproved ?? moc.vesselRequestItem?.qtyRequested ?? "-"} ${moc.vesselRequestItem?.unit ?? ""}`,
							`Tanggal keputusan: ${formatDate(decision.decidedAt)}`,
						],
					},
				],
				margin: [0, 0, 0, 12],
			},
			{ text: "Kriteria dan Bobot", style: "sectionHeader" },
			{
				table: { headerRows: 1, widths: ["*", 90, 70, 110], body: criteriaBody },
				layout: "lightHorizontalLines",
				margin: [0, 0, 0, 12],
			},
			{ text: "Tabel Perangkingan", style: "sectionHeader" },
			{
				table: {
					headerRows: 1,
					widths: [42, "*", 105, 55, 70, 60, 65],
					body: rankingBody,
				},
				layout: "lightHorizontalLines",
				margin: [0, 0, 0, 12],
			},
			{
				columns: [
					{
						width: "50%",
						stack: [
							{ text: "Rekomendasi Sistem", style: "decisionLabel" },
							{
								text: recommended?.vendorName ?? "-",
								fontSize: 13,
								bold: true,
								color: "#047857",
							},
						],
					},
					{
						width: "50%",
						stack: [
							{ text: "Vendor Dipilih", style: "decisionLabel" },
							{ text: selected?.vendorName ?? "-", fontSize: 13, bold: true },
							decision.overrideReason
								? { text: `Alasan override: ${decision.overrideReason}`, italics: true, margin: [0, 4, 0, 0] }
								: { text: "Sesuai rekomendasi sistem", color: "#047857", margin: [0, 4, 0, 0] },
						],
					},
				],
				margin: [0, 4, 0, 18],
			},
			{
				columns: [
					{ width: "55%", text: "" },
					{
						width: "45%",
						stack: [
							{ text: "Diputuskan oleh,", alignment: "center" },
							{ text: "\n\n____________________________", alignment: "center" },
							{
								text: decision.decider?.fullName ?? "Staff Procurement",
								alignment: "center",
								bold: true,
							},
						],
					},
				],
			},
		],
		footer: (currentPage: number, pageCount: number) => ({
			text: `Dokumen keputusan MOC-${moc.id} | Halaman ${currentPage} dari ${pageCount}`,
			alignment: "center",
			fontSize: 8,
			color: "#6b7280",
			margin: [0, 10, 0, 0],
		}),
		defaultStyle: { font: "Helvetica", fontSize: 9.5, color: "#374151" },
		styles: {
			sectionHeader: {
				fontSize: 11,
				bold: true,
				color: "#1e3a8a",
				margin: [0, 6, 0, 5],
			},
			tableHeader: { bold: true, color: "#111827", fillColor: "#e5e7eb" },
			decisionLabel: { fontSize: 9, bold: true, color: "#6b7280", margin: [0, 0, 0, 3] },
		},
	};

	return pdfMake.createPdf(docDefinition).getBuffer();
}
