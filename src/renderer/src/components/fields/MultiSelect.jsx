import React from 'react';
import Select from 'react-select';

const MultiSelect = ({ options, label, value, onChange, placeholder = "Select..." }) => {
    // Map values back to options for react-select
    const selectedOptions = options.filter(option => (value || []).includes(option.value));

    const handleChange = (selected) => {
        // Return array of values to match the parent's expectation
        const values = selected ? selected.map(option => option.value) : [];
        onChange(null, values);
    };

    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: state.isFocused ? '#10b981' : '#e2e8f0', // green-500 or slate-200
            borderRadius: '1rem', // rounded-2xl
            padding: '2px',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
            '&:hover': {
                borderColor: '#10b981'
            }
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: '#f1f5f9', // slate-100
            borderRadius: '8px',
            padding: '2px 4px'
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: '#0f172a', // slate-900
            fontSize: '12px',
            fontWeight: '600'
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#64748b', // slate-500
            '&:hover': {
                backgroundColor: '#fee2e2', // red-100
                color: '#ef4444', // red-500
            }
        }),
        placeholder: (base) => ({
            ...base,
            color: '#94a3b8', // slate-400
            fontSize: '14px'
        })
    };

    return (
        <div className="w-full group">
            {label && (
                <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2 group-focus-within:text-green-500 transition-colors">
                    {label}
                </label>
            )}
            <Select
                isMulti
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                placeholder={placeholder}
                styles={customStyles}
                classNamePrefix="react-select"
                isClearable
            />
        </div>
    );
};

export default MultiSelect;
