import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import { Loader2, X } from "lucide-react";
import PropTypes from "prop-types";
import Input from "../../fields/input";

const schema = z.object({
    scopeOfWork: z.string().min(1, "Scope of work is required"),
    quantity: z.coerce.number().min(0, "Quantity must be positive"),
    hoursPerQty: z.coerce.number().min(0, "Hours per quantity must be positive"),
    totalHours: z.coerce.number().min(0, "Total hours must be positive"),
});

const EditLineItem = ({ lineItem, onClose, onUpdate }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            scopeOfWork: "",
            quantity: 0,
            hoursPerQty: 0,
            totalHours: 0,
        },
    });

    useEffect(() => {
        if (lineItem) {
            reset({
                scopeOfWork: lineItem.scopeOfWork || "",
                quantity: lineItem.quantity || 0,
                hoursPerQty: lineItem.hoursPerQty || 0,
                totalHours: lineItem.totalHours || 0,
            });
        }
    }, [lineItem, reset]);

    const onSubmit = async (data) => {
        try {
            await Service.UpdateLineItemById(lineItem.id, data);
            toast.success("Line item updated successfully");
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error updating line item:", error);
            toast.error("Failed to update line item");
        }
    };

    if (!lineItem) return null;

    return (
        <div className="fixed inset-0 z-index-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Line Item</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scope of Work <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register("scopeOfWork")}
                            rows="3"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all ${errors.scopeOfWork ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder="Enter scope of work"
                        ></textarea>
                        {errors.scopeOfWork && (
                            <p className="text-red-500 text-xs mt-1">{errors.scopeOfWork.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </label>
                            <Input
                                type="number"
                                step="any"
                                {...register("quantity", {
                                    onChange: (e) => {
                                        const hours = watch("hoursPerQty");
                                        const qty = parseFloat(e.target.value) || 0;
                                        setValue("totalHours", qty * hours);
                                    }
                                })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all ${errors.quantity ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hours / Qty
                            </label>
                            <Input
                                type="number"
                                step="any"
                                {...register("hoursPerQty", {
                                    onChange: (e) => {
                                        const qty = watch("quantity");
                                        const hours = parseFloat(e.target.value) || 0;
                                        setValue("totalHours", qty * hours);
                                    }
                                })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all ${errors.hoursPerQty ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.hoursPerQty && (
                                <p className="text-red-500 text-xs mt-1">{errors.hoursPerQty.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Hours
                            </label>
                            <Input
                                type="number"
                                step="any"
                                {...register("totalHours")}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all ${errors.totalHours ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.totalHours && (
                                <p className="text-red-500 text-xs mt-1">{errors.totalHours.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    Updating...
                                </>
                            ) : (
                                "Update"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

EditLineItem.propTypes = {
    lineItem: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

export default EditLineItem;
