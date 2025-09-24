import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentData } from 'firebase/firestore';

const formatBoolean = (value: any) => (value === true ? 'Yes' : 'No');

export const generatePdfReport = (supplier: DocumentData) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Supplier ESG Risk Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Supplier: ${supplier.name}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    
    const risk = supplier.predictedRisk || 'N/A';
    doc.setFontSize(14);
    doc.text(`Overall Predicted Risk: ${risk}`, 14, 50);

    const environmentalData = [
        ['Total Emissions (kg CO₂e)', supplier.total_emissions_kg_co2e?.toLocaleString() ?? 'N/A'],
        ['Annual Water Usage (m³)', supplier.water_usage_m3?.toLocaleString() ?? 'N/A'],
        ['ISO 14001 Certified', formatBoolean(supplier.is_iso14001_certified)],
    ];
    
    const socialData = [
        ['Number of Workers', supplier.number_of_workers ?? 'N/A'],
        ['Employee Turnover Rate', `${supplier.turnover_rate_percent ?? 'N/A'}%`],
        ['Workplace Accidents (Yearly)', supplier.workplace_accidents_last_year ?? 'N/A'],
        ['SA8000 Certified', formatBoolean(supplier.is_sa8000_certified)],
    ];

    const governanceData = [
        ['Has Anti-Corruption Policy', formatBoolean(supplier.has_anti_corruption_policy)],
        ['Publishes ESG Report', formatBoolean(supplier.publishes_esg_report)],
    ];

    autoTable(doc, {
        startY: 60,
        head: [['Environmental Metrics', 'Value']],
        body: environmentalData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }, // Green
    });

    autoTable(doc, {
        head: [['Social Metrics', 'Value']],
        body: socialData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue
    });
    
    autoTable(doc, {
        head: [['Governance Metrics', 'Value']],
        body: governanceData,
        theme: 'striped',
        headStyles: { fillColor: [107, 114, 128] }, // Gray
    });

    doc.save(`GreenChain_ESG_Report_${supplier.name}.pdf`);
};