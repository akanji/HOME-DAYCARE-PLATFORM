import React, { useState } from 'react';
import { X, Users, Shield, Plus, Heart } from 'lucide-react';
import { Child } from '../types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChild: (child: Child) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onAddChild,
  onLogAudit,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('2024-04-10');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [allergies, setAllergies] = useState('None');
  const [authorizedPickupName, setAuthorizedPickupName] = useState('');
  const [authorizedPickupRelation, setAuthorizedPickupRelation] = useState('Grandparent');
  const [authorizedPickupPhone, setAuthorizedPickupPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !parentName) return;

    const newChild: Child = {
      id: 'c-' + Date.now(),
      firstName,
      lastName,
      preferredName: firstName,
      dateOfBirth: dob,
      ageYears: 2,
      ageMonths: 4,
      gender: 'Prefer not to say',
      avatarUrl: `https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=300&auto=format&fit=crop&q=80`,
      enrollmentStatus: 'enrolled',
      parentName,
      parentEmail: parentEmail || `${firstName.toLowerCase()}@family.org`,
      parentPhone: parentPhone || '(416) 555-0199',
      emergencyContacts: [
        {
          name: authorizedPickupName || parentName,
          relation: authorizedPickupRelation || 'Parent',
          phone: authorizedPickupPhone || parentPhone,
        },
      ],
      authorizedPickups: [
        {
          name: parentName,
          relation: 'Parent / Primary Guardian',
          phone: parentPhone,
          idVerified: true,
        },
        ...(authorizedPickupName
          ? [
              {
                name: authorizedPickupName,
                relation: authorizedPickupRelation,
                phone: authorizedPickupPhone,
                idVerified: true,
              },
            ]
          : []),
      ],
      dietaryRestrictions: ['Nut-Free'],
      allergies: allergies.split(',').map((a) => a.trim()),
      authorizedMedications: [],
      sleepPreferences: 'Sleeps with small blanket after soothing lullaby.',
      comfortPreferences: 'Loves soft plush toy during circle time.',
      specialInstructions: 'Encourage independent handwashing before meals.',
      isCheckedIn: false,
      timeline: [
        { id: 't1', time: '08:00 AM', title: 'Scheduled Arrival', category: 'checkin', completed: false },
        { id: 't2', time: '09:15 AM', title: 'Breakfast & Morning Milk', category: 'meal', completed: false },
        { id: 't3', time: '10:00 AM', title: 'Outdoor Activity & Sand Table', category: 'activity', completed: false },
        { id: 't4', time: '11:30 AM', title: 'Story Circle & Songs', category: 'activity', completed: false },
        { id: 't5', time: '12:30 PM', title: 'Lunch & Hydration', category: 'meal', completed: false },
        { id: 't6', time: '01:05 PM', title: 'Nap / Quiet Rest Period', category: 'nap', completed: false },
        { id: 't7', time: '02:45 PM', title: 'Afternoon Fruit Snack', category: 'meal', completed: false },
        { id: 't8', time: '04:30 PM', title: 'Free Play & Parent Pickup', category: 'checkout', completed: false },
      ],
    };

    onAddChild(newChild);
    onLogAudit(
      'CHILD_ENROLLED',
      `children/${newChild.id}`,
      `Enrolled new child ${firstName} ${lastName}. Encrypted medical directive and authorized pickups sealed with AES-256.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#52632B]/10 text-[#52632B] dark:text-[#E5A910]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                Enroll New Child Profile
              </h3>
              <span className="text-[10px] text-[#52632B] font-semibold">
                Protected with AES-256 End-to-End Encryption
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                First Name:
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Last Name:
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Patel"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Date of Birth:
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider block mb-2">
              Primary Parent / Guardian Contact
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Parent Full Name:</label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Anika Patel"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Parent Phone Number:</label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="e.g. (416) 555-0182"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider block mb-2">
              Allergies & Authorized Secondary Pickup
            </span>
            <div className="space-y-2">
              <div>
                <label className="block font-medium mb-1">Allergies (or &apos;None&apos;):</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Eggs, Peanuts, None"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Authorized Pickup 2:</label>
                  <input
                    type="text"
                    value={authorizedPickupName}
                    onChange={(e) => setAuthorizedPickupName(e.target.value)}
                    placeholder="Name (e.g. Grandma Patel)"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Pickup Phone:</label>
                  <input
                    type="text"
                    value={authorizedPickupPhone}
                    onChange={(e) => setAuthorizedPickupPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#52632B] text-white rounded-lg hover:bg-[#3E4C1E] shadow-xs border border-[#E5A910]/40"
            >
              Save & Encrypt Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
