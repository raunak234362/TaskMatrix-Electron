import { useEffect, useState, useRef, useMemo } from "react";
import Service from "../../../api/Service";
import RenderFiles from "../../ui/RenderFiles";
import { Loader2, Inbox, ChevronDown, Filter, FileText, Layers, Search, Calendar, X } from "lucide-react";
import { useParams } from "react-router-dom";

const AllDocumentsByProjectID = ({ projectId }) => {
  const { id } = useParams();
  const finalId = projectId || id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!finalId) return;
      try {
        setLoading(true);
        const response = await Service.GetAllDocumentsByProjectId(finalId);
        setData(response?.data || null);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [finalId]);



  const availableStages = useMemo(() => {
    if (!data) return ["All"];
    const stages = new Set();
    const allItems = [
      ...(data.project?.files || []),
      ...(data.designDrawings || []),
      ...(data.changeOrders || []),
      ...(data.notes || []),
      ...(data.rfi || []),
      ...(data.submittals || [])
    ];
    allItems.forEach((item) => {
      if (item.stage) stages.add(item.stage);
      const files = item.files || (item.file ? [item.file] : []);
      files.forEach((f) => { if (f.stage) stages.add(f.stage); });
    });
    return ["All", ...Array.from(stages).sort()];
  }, [data]);

  const processedData = useMemo(() => {
    if (!data) return null;

    const matchesFilters = (file, parent = {}) => {
      const name = (file.originalName || file.name || "").toLowerCase();
      const parentDesc = (parent.description || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const nameMatch = !searchQuery || name.includes(query) || parentDesc.includes(query);

      const stage = file.stage || parent.stage || "";
      const stageMatch = selectedStage === "All" || stage === selectedStage;

      const dateStr = file.uploadedAt || file.createdAt || parent.createdAt || parent.date;
      const fileDate = dateStr ? dateStr.split("T")[0] : "";
      const dateMatch = !selectedDate || fileDate === selectedDate;

      return nameMatch && stageMatch && dateMatch;
    };

    const filterFlatFiles = (files) => files.filter(f => matchesFilters(f));
    const filterNestedItems = (items) => {
      return items.map(item => {
        const itemFiles = item.files || (item.file ? [item.file] : []);
        const filteredFiles = itemFiles.filter((f) => matchesFilters(f, item));
        return filteredFiles.length > 0 ? { ...item, files: filteredFiles } : null;
      }).filter(Boolean);
    };

    return {
      projectFiles: filterFlatFiles(data.project?.files || []),
      designDrawings: filterNestedItems(data.designDrawings || []),
      changeOrders: filterNestedItems((data.changeOrders || []).map((co) => ({
        ...co,
        description: `Change Order: ${co.changeOrderNumber || "Unknown"}`,
      }))),
      notes: filterNestedItems((data.notes || []).map((note) => ({
        ...note,
        description: `Note (${note.stage})`,
      }))),
      rfis: filterNestedItems((data.rfi || []).map((rfi) => ({
        ...rfi,
        description: `RFI: ${rfi.subject}`,
        files: rfi.files || [],
      }))),
      submittals: filterNestedItems((data.submittals || []).map((sub) => ({
        ...sub,
        description: `Submittal: ${sub.subject}`,
        files: sub.currentVersion?.files || sub.files || [],
      }))),
      rfqs: filterNestedItems((data.rfq || []).map((rfq) => ({
        ...rfq,
        description: `RFQ: ${rfq.subject}`,
        files: rfq.files || [],
      }))),
      coordinationDrawings: filterNestedItems((data.coordinationDrawings || []).map((cd) => ({
        ...cd,
        description: `Coordination Drawing: ${cd.title || cd.description || "No Description"}`,
        files: cd.files || [],
      }))),
      progressReports: filterNestedItems((data.progressReports || []).map((pr) => ({
        ...pr,
        description: `Progress Report: ${pr.title || "No Title"}`,
        files: pr.files || [],
      }))),
    };
  }, [data, searchQuery, selectedStage, selectedDate]);

  if (loading || !data || !processedData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        {loading ? "Loading Documents..." : "No Documents Available"}
      </div>
    );
  }

  const { projectFiles, designDrawings, changeOrders, notes, rfis, submittals, rfqs, coordinationDrawings, progressReports } = processedData;

  const categories = [
    { id: "All", label: "All Files", count: (projectFiles.length + designDrawings.length + changeOrders.length + rfis.length + submittals.length + notes.length + rfqs.length + coordinationDrawings.length + progressReports.length) },
    { id: "Project Documents", label: "Project Documents", count: projectFiles.length },
    { id: "Documents", label: "Design Drawings", count: designDrawings.length },
    { id: "Change Orders", label: "Change Orders", count: changeOrders.length },
    { id: "Requests for Information (RFI)", label: "RFI", count: rfis.length },
    { id: "Submittals", label: "Submittals", count: submittals.length },
    { id: "RFQ", label: "RFQ", count: rfqs.length },
    { id: "Coordination Drawings", label: "Coordination Drawings", count: coordinationDrawings.length },
    { id: "Progress Reports", label: "Progress Reports", count: progressReports.length },
    { id: "Notes", label: "Notes", count: notes.length },
  ].filter(cat => cat.id === "All" || cat.count > 0);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "—";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Integrated Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-black uppercase tracking-widest">Project Files</h3>
          <div className="relative" ref={categoryRef}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white border border-black rounded-none text-sm font-bold uppercase tracking-tight hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#6bbd45]" />
              {categories.find(c => c.id === selectedCategory)?.label || "Type"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoryOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-black rounded-none shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-tight transition-colors cursor-pointer ${selectedCategory === cat.id
                        ? "bg-green-50 text-green-700"
                        : "text-black hover:bg-gray-50 hover:text-black"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {cat.id === "All" ? <Layers className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {cat.label}
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-none border border-black font-semibold text-black">{cat.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-black font-bold uppercase tracking-widest">
            {categories.find(c => c.id === selectedCategory)?.count} Total Files
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center py-2">
        <div className="relative md:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all placeholder:text-gray-500 placeholder:font-normal shadow-sm cursor-pointer"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="relative">
          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full pl-9 pr-10 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm appearance-none cursor-pointer"
          >
            {availableStages.map(s => <option key={s} value={s}>{s === "All" ? "All Stages" : s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm cursor-pointer"
          />
        </div>
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedStage("All");
            setSelectedDate("");
            setSelectedCategory("All");
          }}
          className="flex items-center justify-center gap-2 px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
        >
          <X size={16} strokeWidth={3} />
          Reset Filters
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {projectFiles.length > 0 && (selectedCategory === "All" || selectedCategory === "Project Documents") && (
          <Section title="Project Documents">
            <RenderFiles files={projectFiles} table="project" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {designDrawings.length > 0 && (selectedCategory === "All" || selectedCategory === "Documents") && (
          <Section title="Documents">
            <RenderFiles files={designDrawings} table="designDrawings" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {changeOrders.length > 0 && (selectedCategory === "All" || selectedCategory === "Change Orders") && (
          <Section title="Change Orders">
            <RenderFiles files={changeOrders} table="changeOrders" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {rfis.length > 0 && (selectedCategory === "All" || selectedCategory === "Requests for Information (RFI)") && (
          <Section title="Requests for Information (RFI)">
            <RenderFiles files={rfis} table="rFI" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {submittals.length > 0 && (selectedCategory === "All" || selectedCategory === "Submittals") && (
          <Section title="Submittals">
            <RenderFiles files={submittals} table="submittals" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {rfqs.length > 0 && (selectedCategory === "All" || selectedCategory === "RFQ") && (
          <Section title="Request for Quotation (RFQ)">
            <RenderFiles files={rfqs} table="rFQ" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {coordinationDrawings.length > 0 && (selectedCategory === "All" || selectedCategory === "Coordination Drawings") && (
          <Section title="Coordination Drawings">
            <RenderFiles files={coordinationDrawings} table="coordinationDrawings" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {progressReports.length > 0 && (selectedCategory === "All" || selectedCategory === "Progress Reports") && (
          <Section title="Progress Reports">
            <RenderFiles files={progressReports} table="progressReports" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {notes.length > 0 && (selectedCategory === "All" || selectedCategory === "Notes") && (
          <Section title="Notes">
            <RenderFiles files={notes} table="project" parentId={finalId || ""} hideHeader={true} formatDate={formatDate} />
          </Section>
        )}
        {Object.values(processedData).every(arr => arr.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-black bg-white rounded-none border border-dashed border-black/30">
            <Search className="w-12 h-12 mb-4 text-black/40" />
            <p className="text-sm font-bold uppercase tracking-widest">No files match your filters</p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedStage("All"); setSelectedCategory("All"); setSelectedDate(""); }}
              className="mt-4 px-4 py-1.5 text-sm font-bold uppercase tracking-tight rounded-none border border-black hover:bg-slate-50 transition-all cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-sm text-black font-bold uppercase tracking-widest ml-1">{title}</h3>
    <div className="bg-transparent shadow-none space-y-4">
      {children}
    </div>
  </div>
);

export default AllDocumentsByProjectID;
