import { Key, MessageSquareText, Save, Edit3 } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

export function TwilioConfigPage() {
  const { twilioConfig, setTwilioConfig, smsTemplates, setSmsTemplates } = useAppContext();
  
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  const handleSaveConfig = () => {
    if (isEditingConfig) {
      console.log("Saving Twilio Config:", twilioConfig);
      console.log("Twilio Config Saved successfully!");
    }
    setIsEditingConfig(!isEditingConfig);
  };

  const handleSaveTemplate = (type: string) => {
    console.log(`Saving ${type} template:`, smsTemplates[type as keyof typeof smsTemplates]);
    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} template saved successfully!`);
    setEditingTemplate(null);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-[#151518] rounded-xl border border-[#1F1F23] overflow-hidden">
        <div className="p-5 border-b border-[#1F1F23] bg-[#1A1A1E] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Twilio SMS Configuration</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${twilioConfig.enabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                {twilioConfig.enabled ? 'Notifications Active' : 'Notifications Disabled'}
              </span>
              <button 
                onClick={() => setTwilioConfig({...twilioConfig, enabled: !twilioConfig.enabled})}
                className={`w-10 h-5 rounded-full transition-colors relative ${twilioConfig.enabled ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800 border border-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${twilioConfig.enabled ? 'right-1 bg-emerald-500' : 'left-1 bg-slate-500'}`}></div>
              </button>
            </div>
            <button 
              onClick={handleSaveConfig}
              className="text-[11px] text-indigo-400 font-semibold hover:underline uppercase"
            >
              {isEditingConfig ? "Save Config" : "Edit Config"}
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account SID</label>
              <input 
                type="text" 
                value={twilioConfig.accountSid}
                onChange={(e) => setTwilioConfig({...twilioConfig, accountSid: e.target.value})}
                disabled={!isEditingConfig}
                className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm font-mono text-slate-400 focus:border-indigo-500 outline-none disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Auth Token</label>
              <input 
                type="password" 
                value={twilioConfig.authToken}
                onChange={(e) => setTwilioConfig({...twilioConfig, authToken: e.target.value})}
                disabled={!isEditingConfig}
                className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm font-mono text-slate-400 focus:border-indigo-500 outline-none disabled:opacity-50"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">From Phone Number</label>
              <input 
                type="text" 
                value={twilioConfig.fromPhoneNumber}
                onChange={(e) => setTwilioConfig({...twilioConfig, fromPhoneNumber: e.target.value})}
                disabled={!isEditingConfig}
                className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-2.5 text-sm font-mono text-slate-400 focus:border-indigo-500 outline-none disabled:opacity-50"
              />
            </div>
            <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
              <p className="text-[11px] text-indigo-300 leading-relaxed italic">
                Ensuring all tenants use isolated sub-accounts via Twilio Organizations. SiteID will be mapped as a service tag.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#151518] rounded-xl border border-[#1F1F23] overflow-hidden">
        <div className="p-5 border-b border-[#1F1F23] bg-[#1A1A1E] flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">SMS Notification Templates</h2>
          <span className="text-[10px] text-slate-500 italic">Supports variables: %customer_full_name%, %service_name%</span>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Pending Template */}
          <div className="p-4 bg-[#0A0A0C] rounded-lg border border-[#1F1F23] flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 pr-4">
              <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                <MessageSquareText size={20} />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Template: Pending</span>
                {editingTemplate === 'pending' ? (
                  <input
                    value={smsTemplates.pending}
                    onChange={(e) => setSmsTemplates({...smsTemplates, pending: e.target.value})}
                    className="w-full bg-[#111114] border border-indigo-500/50 rounded px-3 py-1.5 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-slate-300 font-mono">
                    {smsTemplates.pending}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => editingTemplate === 'pending' ? handleSaveTemplate('pending') : setEditingTemplate('pending')}
              className="px-3 py-1.5 border border-[#1F1F23] rounded text-[11px] hover:bg-[#1A1A1E] transition-colors uppercase font-bold bg-[#0A0A0C] shrink-0"
            >
              {editingTemplate === 'pending' ? 'Save' : 'Edit Template'}
            </button>
          </div>

          {/* Approved Template */}
          <div className="p-4 bg-[#0A0A0C] rounded-lg border border-[#1F1F23] flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 pr-4">
              <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquareText size={20} />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Template: Approved</span>
                {editingTemplate === 'approved' ? (
                  <input
                    value={smsTemplates.approved}
                    onChange={(e) => setSmsTemplates({...smsTemplates, approved: e.target.value})}
                    className="w-full bg-[#111114] border border-indigo-500/50 rounded px-3 py-1.5 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-slate-300 font-mono">
                    {smsTemplates.approved}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => editingTemplate === 'approved' ? handleSaveTemplate('approved') : setEditingTemplate('approved')}
              className="px-3 py-1.5 border border-[#1F1F23] rounded text-[11px] hover:bg-[#1A1A1E] transition-colors uppercase font-bold bg-[#0A0A0C] shrink-0"
            >
              {editingTemplate === 'approved' ? 'Save' : 'Edit Template'}
            </button>
          </div>

          {/* Rejected Template */}
          <div className="p-4 bg-[#0A0A0C] rounded-lg border border-[#1F1F23] flex items-center justify-between opacity-70">
            <div className="flex items-center gap-4 flex-1 pr-4">
              <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-rose-400 shrink-0">
                <MessageSquareText size={20} />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Template: Rejected</span>
                {editingTemplate === 'rejected' ? (
                  <input
                    value={smsTemplates.rejected}
                    onChange={(e) => setSmsTemplates({...smsTemplates, rejected: e.target.value})}
                    className="w-full bg-[#111114] border border-indigo-500/50 rounded px-3 py-1.5 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-slate-300 font-mono">
                    {smsTemplates.rejected}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => editingTemplate === 'rejected' ? handleSaveTemplate('rejected') : setEditingTemplate('rejected')}
              className="px-3 py-1.5 border border-[#1F1F23] rounded text-[11px] hover:bg-[#1A1A1E] transition-colors uppercase font-bold bg-[#0A0A0C] shrink-0"
            >
              {editingTemplate === 'rejected' ? 'Save' : 'Edit Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
