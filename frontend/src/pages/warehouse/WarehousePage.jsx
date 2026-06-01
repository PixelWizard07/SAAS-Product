import { useState } from 'react';
import { MapPin, Plus, Pencil, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_WAREHOUSES = [
  {
    id: 'wh1',
    name: 'Primary Warehouse',
    isPrimary: true,
    address: '123 Industrial Area, Mumbai, Maharashtra 400001',
    contactName: 'Rajesh Kumar',
    contactPhone: '+91 9876543210',
    pickupDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    status: 'Active',
  },
  {
    id: 'wh2',
    name: 'Warehouse 2',
    isPrimary: false,
    address: '45 Commerce Street, Delhi, DL 110001',
    contactName: 'Suresh Singh',
    contactPhone: '+91 9123456789',
    pickupDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    status: 'Active',
  },
];

const emptyForm = {
  name: '', addressLine1: '', city: '', state: '', pincode: '',
  contactName: '', contactPhone: '', pickupDays: [],
};

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      pickupDays: p.pickupDays.includes(day)
        ? p.pickupDays.filter(d => d !== day)
        : [...p.pickupDays, day],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.addressLine1 || !form.city || !form.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    const newWh = {
      id: `wh${Date.now()}`,
      name: form.name,
      isPrimary: false,
      address: `${form.addressLine1}, ${form.city}, ${form.state} ${form.pincode}`,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      pickupDays: form.pickupDays,
      status: 'Active',
    };
    setWarehouses(prev => [...prev, newWh]);
    toast.success('Warehouse added successfully!');
    setShowModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Warehouse</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
        Manage your warehouse pickup locations. Meesho pickup agents will collect orders from these addresses.
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {warehouses.map(wh => (
          <div key={wh.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-800">{wh.name}</h2>
                {wh.isPrimary && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  <CheckCircle size={11} /> {wh.status}
                </span>
                <button
                  onClick={() => toast.success(`Editing ${wh.name}`)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{wh.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-base">👤</span>
                <span>{wh.contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span>{wh.contactPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">Pickup Days:</span>
                <div className="flex flex-wrap gap-1">
                  {wh.pickupDays.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-800">Add Warehouse</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse 3"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="Street / Area"
                  value={form.addressLine1}
                  onChange={e => setForm(p => ({ ...p, addressLine1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={form.pincode}
                  onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.contactName}
                    onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.contactPhone}
                    onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        form.pickupDays.includes(day)
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition"
                >
                  Add Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
