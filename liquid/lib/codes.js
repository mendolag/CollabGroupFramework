var errorCodes = Object.freeze({
	no_error: 0,
	config_no_pages: 101,
	config_no_groups: 102,
	config_no_globals: 1031,
	config_no_locals: 1032,
	config_no_view_match: 104,
	config_no_script_match: 105,
	config_no_css_match: 106,
	config_no_sub_match: 107,
	config_no_exe_match: 108,
	config_no_share_match: 109,
	config_no_variables_init: 110,
	config_no_webrtc: 111,
	config_no_variables_forwarding: 112,
	config_no_permeission: 113,
	config_no_xmpp: 114,
	config_no_wsliquid: 115,
	config_no_database: 116
});

var errorCodesMeaning = Object.freeze({
	0: "No error",
	100: "config has no port specification",
	101: "config has no pages specification",
	102: "config has no groups specification",
	1031: "config has no globals specification",
 	1032: "config has no locals specification",
	104: "config has an unmatched page-view specification",
	105: "config has an unmatched page-script specification",
	106: "config has an unmatched page-css specification",
	107: "config has an unmatched page-group specification",
	108: "config has an unmatched variable-execution specification",
	109: "config has an unmatched variable-group specification",
	110: "config has no variable initialisation specification",
	111: "config has no webRTC configuration specification",
	112: "config has no variable forwarding specification",
	113: "config has no variable permission specification"
});

var errorCodeToString = function(code) {
	return errorCodesMeaning[code]
}

module.exports = {
	errorCodes: errorCodes,
	errorCodeToString: errorCodeToString
};