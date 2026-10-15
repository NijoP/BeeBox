const out=[];for(const query of ['TYPE-C-31-M-12','0603WAF5101T5E','GRM21BR71A106KE51L','CL10B103KB8NNNC'])out.push({query,results:await eda.lib_Device.search(query)});return out;
