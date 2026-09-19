import SideMenu from "../_utils/SideMenu"

export default function Layout ({ children }: { children: React.ReactNode }) {
  const links = [
    {
      title: "Profile",
      path: "/profile"
    },
    {
      title: "Notifications",
      path: "/profile/notifications"
    },
    {
      title: "Watches",
      path: "/profile/watches"
    },
    {
      title: "Subscriptions",
      path: "/profile/membership"
    }
  ]

  return (
    <section className="container flex flex-col md:flex-row mx-auto p-4 gap-8">
      <SideMenu links={links} />
      <div className="w-full">
        {children}
      </div>
    </section>
  )
}
