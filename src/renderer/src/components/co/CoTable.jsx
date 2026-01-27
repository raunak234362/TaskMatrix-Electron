import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Button from "../fields/Button";
import Input from "../fields/input";
import Service from "../../api/Service";
import { toast } from "react-toastify";


const CoTable = ({ coId }) => {
  const [loading, setLoading] = useState(true);
  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      rows: [
        {
          description: "",
          referenceDoc: "",
          elements: "",
          QtyNo: "0",
          hours: "0",
          cost: "0",
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, replace } = useFieldArray({ control, name: "rows" });

  const fetchTableRows = async () => {
    if (!coId) return;
    try {
      setLoading(true);
      const response = await Service.GetAllCOTableRows(coId);
      const rows = response?.data || [];
      if (rows.length > 0) {
        replace(
          rows.map((r) => ({
            description: r.description,
            referenceDoc: r.referenceDoc,
            elements: r.elements,
            QtyNo: r.QtyNo,
            hours: r.hours,
            cost: r.cost,
            remarks: r.remarks,
          }))
        );
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableRows();
  }, [coId]);

  const onSubmit = async (data) => {
    try {
      // Map data to numbers as done in your original JSX
      const formattedRows = data.rows.map((row) => ({
        ...row,
        QtyNo: row.QtyNo,
        hours: row.hours,
        cost: row.cost,
      }));

      await Service.addCOTable(formattedRows, coId);
      toast.success("Table saved successfully!");
      fetchTableRows();
    } catch (err) {
      toast.error("Failed to save table data");
    }
  };

  const rows = watch("rows") || [];
  const totalHours = rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
  const totalCost = rows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-green-600">
        Loading Table Data...
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Description</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Elements</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-24">Hours</th>
                <th className="p-3 w-28">Cost ($)</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-700">{index + 1}</td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.description`}
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.referenceDoc`}
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.elements`}
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.QtyNo`}
                      control={control}
                      render={({ field }) => <Input {...field} type="number" />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.hours`}
                      control={control}
                      render={({ field }) => <Input {...field} type="number" />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.cost`}
                      control={control}
                      render={({ field }) => <Input {...field} type="number" />}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`rows.${index}.remarks`}
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 font-bold">
                <td colSpan={5} className="p-3 text-right text-green-900">
                  Total
                </td>
                <td className="p-3 text-green-900">{totalHours}</td>
                <td className="p-3 text-green-900">
                  ${totalCost.toLocaleString()}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={() =>
              append({
                description: "",
                referenceDoc: "",
                elements: "",
                QtyNo: "0",
                hours: "0",
                cost: "0",
                remarks: "",
              })
            }
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            + Add Row
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white shadow-md"
          >
            Finalize & Save Table
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CoTable;
