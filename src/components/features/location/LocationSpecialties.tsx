interface LocationSpecialtiesProps {
  specialties: string[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, value: string) => void
}

export const LocationSpecialties = ({
  specialties,
  onAdd,
  onRemove,
  onUpdate,
}: LocationSpecialtiesProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">主打商品</h3>

      <div className="mb-4">
        {specialties.map((specialty, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={specialty}
              onChange={e => onUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入主打商品"
            />
            {specialties.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
        >
          + 新增商品項目
        </button>
      </div>
    </div>
  )
}
