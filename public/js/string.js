function camelCase(str) {
	return str.replace(/_([a-z])/g, function (m, w) {
	    return w.toUpperCase();
	});
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
	camelCase: camelCase,
	capitalize: capitalize
};