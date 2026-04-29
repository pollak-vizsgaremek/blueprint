type EventModalTab = "details" | "discussion" | "news" | "place";

type EventModalTabsProps = {
  activeTab: EventModalTab;
  onSelect: (tab: EventModalTab) => void;
};

const tabs: Array<{ id: EventModalTab; label: string }> = [
  { id: "details", label: "Részletek" },
  { id: "news", label: "Hírek" },
  { id: "place", label: "Helyszín" },
  { id: "discussion", label: "Beszélgetés" },
];

export const EventModalTabs = ({
  activeTab,
  onSelect,
}: EventModalTabsProps) => {
  return (
    <div className="border-b-[1px] border-b-faded/20 bg-secondary/30 px-2 py-3 sm:px-5 sm:py-5">
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-base sm:text-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 sm:px-4 sm:py-0 relative transition ${
              activeTab === tab.id
                ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[13px] sm:after:-bottom-[21px] after:left-0"
                : "text-gray-400 cursor-pointer"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
