function __load_commons(){
	return {
		
		button_processing: function(value) {
			var text = this._get('text')

			if(value == 'delete') {
				text = text.substr(0, text.length - 1);
			} else {
				text = text + value
			}

			this._set('text', text)
		}
	}
}

exports.__load_commons = __load_commons