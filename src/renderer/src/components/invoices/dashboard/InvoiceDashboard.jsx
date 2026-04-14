import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import InvoiceStatsCards from "./InvoiceStatsCards";
import InvoiceAnalytics from "./InvoiceAnalytics";
import PendingInvoiceList from "./PendingInvoiceList";
import RecentInvoiceActivity from "./RecentInvoiceActivity";



const InvoiceDashboard = ({ navigateToCreate }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await Service.GetAllInvoice();
                setInvoices(Array.isArray(res) ? res : res?.data || []);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">


            {/* 1. Stats Cards */}
            <InvoiceStatsCards invoices={invoices} />



            {/* 3. Analytics (Charts) */}
            <InvoiceAnalytics invoices={invoices} />

            {/* 4. Bottom Section + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <PendingInvoiceList invoices={invoices} />
                </div>
                <div className="xl:col-span-1">
                    <RecentInvoiceActivity invoices={invoices} />
                </div>
            </div>
        </div>
    );
};

export default InvoiceDashboard;
