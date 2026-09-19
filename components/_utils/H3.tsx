export default function H3 ({ id, children }: { id?: string, children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-xl mt-10 scroll-mt-20 first:mt-2 mb-4 border-zinc-700 border-b-2 border-dashed">
      {children}
    </h3>
  )
}
