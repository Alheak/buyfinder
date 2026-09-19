export default function H2 ({ id, children }: { id?: string, children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-3xl mt-14 scroll-mt-20 first:mt-4 mb-4 border-slate-600 border-b-2 border-dashed">
      {children}
    </h2>
  )
}
