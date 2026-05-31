type RoomSidebarProps = {
  children: React.ReactNode;
};

export function RoomSidebar({ children }: RoomSidebarProps) {
  return (
    <aside className="room-sidebar">
      <section className="card">{children}</section>
    </aside>
  );
}