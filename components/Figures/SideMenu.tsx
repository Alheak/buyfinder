import { Dispatch, SetStateAction } from "react"
import SelectFilter from '../../components/_utils/SelectFilter'

export default function SideMenu (
  {
    origins,
    manufacturers,
    categories,
    classifications,
    filters,
    setFilters
  }: {
    origins: string[]
    manufacturers: string[]
    categories: string[]
    classifications: string[]
    filters: { [key: string]: string | undefined }
    setFilters: Dispatch<SetStateAction<{ [key: string]: string | undefined }>>
  }
) {
  return (
    <div className="md:sticky md:top-20 flex flex-col w-full md:max-w-sm max-h-screen mb-4 md:mr-4 md:mb-0 gap-y-4 z-10">
      <SelectFilter title="Category" name="category" value={filters.category as string} options={categories} update={(value) => setFilters(prev => ({ ...prev, category: value || undefined }))} />
      <SelectFilter title="Classification" name="classification" value={filters.classification as string} options={classifications} update={(value) => setFilters(prev => ({ ...prev, classification: value || undefined }))} />
      <SelectFilter title="Origin" name="origin" value={filters.origin as string} options={origins} update={(value) => setFilters(prev => ({ ...prev, origin: value || undefined }))} />
      <SelectFilter title="Manufacturer" name="manufacturer" value={filters.manufacturer as string} options={manufacturers} update={(value) => setFilters(prev => ({ ...prev, manufacturer: value || undefined }))} />
    </div>
  )
}
