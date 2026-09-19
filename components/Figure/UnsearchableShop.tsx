import { shops } from '../../data/shopsClient'

export default function UnsearchableShop ({ shop }: { shop: string }) {
  const shopInfo = shops[shop]

  return (
    <div className="relative my-2 hover:no-underline">
    <div className="flex justify-between px-3 py-2 rounded-lg shadow-sm bg-zinc-200 dark:bg-zinc-800 text-xl">
        <h3 className="text-zinc-500 dark:text-zinc-500">
        <div className="flex flex-wrap items-center gap-2">
            <p>
            {shopInfo.name}
            </p>
        </div>
        </h3>
        <div className="flex">
        <h3 className="text-zinc-400 dark:text-zinc-600">Unsearchable (shop doesn&apos;t support barcode-only search)</h3>
        </div>
    </div>
    </div>
  )
}