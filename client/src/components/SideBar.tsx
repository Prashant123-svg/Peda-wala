import {
  ArrowRightFromLine,
  ArrowLeftFromLine,
  Nut,
  CloudMoon,
  Apple,
  HeartPulse,
  Candy,
  TrendingUp,
  Hourglass,
} from "lucide-react";

interface Props {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const SideBar = ({
  selectedCategory,
  setSelectedCategory,
  collapsed,
  setCollapsed,
}: Props) => {
  const categories = [
    { name: "Classic Pedas", icon: Hourglass },
    { name: "Nutty & Dry Fruit Pedas", icon: Nut },
    { name: "Modern Fusion Pedas", icon: TrendingUp },
    { name: "Seasonal Pedas", icon: CloudMoon },
    { name: "Healthy Pedas", icon: HeartPulse },
    { name: "Fruit Pedas", icon: Apple },
    { name: "Exotic Pedas", icon: Candy },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-5 border-b border-gray-700">
        {!collapsed && (
          <h2 className="text-lg font-bold tracking-wide">
            Categories
          </h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-700 transition"
        >
          {collapsed ? <ArrowRightFromLine /> : <ArrowLeftFromLine />}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">

        {categories.map((cat) => {
          const Icon = cat.icon;

          const isActive = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center w-full rounded-lg transition-all duration-200
              ${collapsed ? "justify-center py-3" : "px-3 py-3"}
              
              ${
                isActive
                  ? "bg-yellow-400 text-black shadow-md"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              <Icon className="h-5 w-5" />

              {!collapsed && (
                <span className="ml-3 text-sm font-medium">
                  {cat.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SideBar;