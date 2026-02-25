import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import {
  Loader2, AlertCircle, Link2, MapPin, Users, Activity, CheckCircle2,
  MoreHorizontal, Edit, Users2, Archive, FileText, Mail, Phone,
  Calendar, ClipboardList
} from "lucide-react";
import EditConnectionDesigner from "./EditConnectionDesigner";
import { AllCDEngineer } from "../..";
import RenderFiles from "../../common/RenderFiles";

const GetConnectionDesignerByID = ({ id }) => {
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModel, setEditModel] = useState(null);
  const [engineerModel, setEngineerModel] = useState(null);

  useEffect(() => {
    const fetchDesigner = async () => {
      if (!id) {
        setError("Invalid Connection Designer ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await Service.FetchConnectionDesignerByID(id);
        setDesigner(response?.data || null);
      } catch (err) {
        console.error("Error fetching Connection Designer:", err);
        setError("Failed to load Connection Designer details");
      } finally {
        setLoading(false);
      }
    };

    fetchDesigner();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">Loading Intelligence...</p>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-600">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">{error || "Connection Designer not found"}</p>
      </div>
    );
  }

  const sections = [
    {
      label: "Total Engineers",
      value: designer.CDEngineers?.length || 0,
      icon: Users,
      color: "blue"
    },
    {
      label: "Active Projects",
      value: 0, // Placeholder
      icon: Activity,
      color: "green"
    },
    {
      label: "Status",
      value: designer.isDeleted ? "Inactive" : "Active",
      icon: CheckCircle2,
      color: designer.isDeleted ? "red" : "green"
    },
    {
      label: "Availability",
      value: "High", // Placeholder
      icon: Calendar,
      color: "purple"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black text-2xl border border-green-100">
            {designer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">{designer.name}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
              <MapPin size={12} /> {designer.location || "Location not set"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((s, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
            <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 flex items-center justify-center text-${s.color}-600 mb-2`}>
              <s.icon size={16} />
            </div>
            <span className="text-[14px] font-black text-black">{s.value}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Actions and Admin */}
        <div className="space-y-8">
          {/* Pending Actions */}
          <section>
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ClipboardList size={14} className="text-green-600" />
              Pending Actions
            </h3>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group border-b border-gray-50 last:border-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileText size={14} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Review New RFQ Response</span>
                </div>
                <MoreHorizontal size={14} className="text-gray-300 group-hover:text-gray-600" />
              </div>
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No pending critical actions</p>
              </div>
            </div>
          </section>

          {/* Administrative Control */}
          <section>
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <MoreHorizontal size={14} className="text-green-600" />
              Administrative Control
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setEditModel(designer)}
                className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col items-center gap-2 hover:border-green-500 hover:shadow-md transition-all group"
              >
                <Edit size={20} className="text-gray-400 group-hover:text-green-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Edit Designer</span>
              </button>
              <button
                onClick={() => setEngineerModel(designer)}
                className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <Users2 size={20} className="text-gray-400 group-hover:text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Manage Workforce</span>
              </button>
              <button className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col items-center gap-2 hover:border-red-500 hover:shadow-md transition-all group">
                <Archive size={20} className="text-gray-400 group-hover:text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Archive Profile</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Profile Details and Files */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <FileText size={14} className="text-green-600" />
              Profile Details
            </h3>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Email Address</span>
                <span className="font-black text-black">{designer.email || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Contact Number</span>
                <span className="font-black text-black">{designer.contactInfo || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Service Region</span>
                <span className="font-black text-black">{Array.isArray(designer.state) ? designer.state.join(", ") : "Global"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Website</span>
                <a href={designer.websiteLink} target="_blank" className="font-black text-green-600 hover:underline">{designer.websiteLink ? "Visit Link" : "N/A"}</a>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Link2 size={14} className="text-green-600" />
              Compliance & Assets
            </h3>
            <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-xs">
              <RenderFiles
                files={designer.files}
                table="connection-designer"
                parentId={id}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      {editModel && (
        <EditConnectionDesigner
          onClose={() => setEditModel(null)}
          designerData={designer}
        />
      )}
      {engineerModel && (
        <AllCDEngineer
          onClose={() => setEngineerModel(null)}
          designerData={designer}
        />
      )}
    </div>
  );
};

export default GetConnectionDesignerByID;
