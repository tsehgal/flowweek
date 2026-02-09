'use client';

interface EditModeToggleProps {
  isEditMode: boolean;
  isEdited: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export default function EditModeToggle({
  isEditMode,
  isEdited,
  onToggle,
  onReset,
}: EditModeToggleProps) {
  const handleReset = () => {
    if (confirm('Reset to original AI-generated schedule? All edits will be lost.')) {
      onReset();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Edit Mode Toggle */}
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isEditMode
            ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {isEditMode ? '✓ Edit Mode' : 'Edit Schedule'}
      </button>

      {/* Edited Badge */}
      {isEdited && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="font-medium">Edited</span>
        </div>
      )}

      {/* Reset Button */}
      {isEdited && (
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          Reset to Original
        </button>
      )}
    </div>
  );
}
