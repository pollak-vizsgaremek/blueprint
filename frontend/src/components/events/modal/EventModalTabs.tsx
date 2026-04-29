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
    <div className="flex items-center border-b-[1px] border-b-faded/20 bg-secondary/30 p-5 pb-5 text-2xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`px-4 relative transition ${
            activeTab === tab.id
              ? "after:content-[''] pointer-events-none after:block after:w-full after:h-[1px] after:bg-faded/80 after:absolute after:-bottom-[21px] after:left-0"
              : "text-gray-400 cursor-pointer"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
