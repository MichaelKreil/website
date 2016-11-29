$(function () {
	var now = Date.now();
	var scale = 3e-8;
	var startDate = '1980-03-13';
	var endDate = (new Date()).toISOString().substr(0,10);
	var maxHeight = parseTime(startDate).top;

	var snap = Snap('#timeline');
	snap.attr({height:maxHeight+10});

	var entries = $('.entry');
	entries = entries.get().map(function (node) {
		var node = $(node);
		var time = node.find('time').text();
		time = parseInterval(time);
		var type = node.attr('entrytype');
		var color = [85,85,85];
		switch (type) {
			case 'work':
			case 'school':  color = [255,0,0]; break;
			case 'award':   color = [255,170,0]; break;
			case 'project': color = [0,85,255]; break;
		}
		//color = color.map(function (v) { return v*0.3 });
		color = 'rgb('+color.join(',')+')';

		return {
			node: node,
			time: time,
			color: color,
			type: type
		}
	});

	$('body').addClass('enhanced');

	entries.forEach(function (entry) {
		entry.height = entry.node.outerHeight();
		entry.top = entry.time.start.top - entry.height/2;
	});

	entries.sort(function (a,b) {
		return a.top - b.top;
	})

	var padding = 5;

	// 1 Scan Forward
	var top = 0;
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		entry.top1 = entry.top;
		if (entry.top1 < top) entry.top1 = top;
		top = entry.top1 + entry.height + padding;
	}

	// 2a Scan Backward
	var top = 1e10;
	for (var i = entries.length-1; i >= 0; i--) {
		var entry = entries[i];
		entry.top2 = entry.top;
		top -= entry.height + padding;
		if (entry.top2 > top) entry.top2 = top;
		top = entry.top2;
	}

	// 2b Scan Forward
	var top = 0;
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		if (entry.top2 < top) entry.top2 = top;
		top = entry.top2 + entry.height + padding;
	}

	var axisX0 = 70;
	var axisX2 = 200;
	var axisX1 = (axisX0+axisX2)/2;

	entries.forEach(function (entry) {
		entry.top = (entry.top1 + entry.top2)/2;

		entry.y = entry.top + entry.height/2;
		entry.node.css('top', entry.top);

		if (maxHeight < entry.y + entry.height) maxHeight = entry.y + entry.height;
		if (entry.time.end && maxHeight < entry.time.end.top) maxHeight = entry.time.end.top;

		if (entry.time.end) {
			var x = axisX0+15;
			var g = snap.g();
			g.add(addLine([x-10, entry.time.start.top, x+10, entry.time.start.top], entry.color));
			if (entry.time.end.value !== now) {
				g.add(addLine( entry, [x-10, entry.time.end.top,   x+10, entry.time.end.top], entry.color));
			}
			g.add(addArrow([x, entry.time.start.top, x, entry.time.end.top], entry.color));
			g.add(addPath([
				'M',x+10, entry.time.start.top,
				'C',axisX1, entry.time.start.top,
				    axisX1, entry.y,
				    axisX2, entry.y
			], entry.color));
			g.attr({opacity:0.3});
		} else {
			addPath([
				'M',axisX0, entry.time.top,
				'C',axisX1, entry.time.top,
				    axisX1, entry.y,
				    axisX2, entry.y
			], entry.color).attr({opacity:0.3});
		}
	})

	// vertical axis
	var axisColor = '#aaa';
	snap.line(axisX0, 0, axisX0, maxHeight).attr({ stroke: axisColor, strokeWidth: 1 });

	var i0 = startDate.split('-'); i0 = parseInt(i0[0], 10)*12 + parseInt(i0[1], 10) - 1;
	var i1 =   endDate.split('-'); i1 = parseInt(i1[0], 10)*12 + parseInt(i1[1], 10) - 1;
	for (var i = i0; i <= i1; i++) {
		var d = Math.floor(i/12)+'-'+((i % 12)+1);
		d = parseTime(d);

		if (i % 12 === 0) {
			snap.text(0, 0, Math.floor(i/12))
				.attr({ stroke: 'none', fill: axisColor, class: 'yearlabel', transform: 'translate('+32+','+(d.top-5)+') rotate(-90)' })
				//.transform('r0t0,'+(d.top));
			
			snap.line(0, d.top, axisX0, d.top).attr({ stroke: axisColor, strokeWidth: 1 });
		} else {
			snap.line(axisX0-20, d.top, axisX0, d.top).attr({ stroke: axisColor, strokeWidth: 1 });
		}
		snap.text(0, 0, ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][i % 12])
			.attr({ stroke: 'none', fill: axisColor, class: 'monthlabel', transform: 'translate('+(axisX0-3)+','+(d.top-3)+') rotate(-90)' })
			//.transform('t'+(axisX0)+','+(d.top)+'r-90');
	}

	function parseInterval(text) {
		var parts = text.split(' - ');
		var result = {start:parseTime(parts[0])};
		result.top = result.start.top;

		if (parts.length === 2) result.end = parseTime(parts[1]);
		if (result.end) result.top = (result.top + result.end.top)/2;
		
		return result;
	}

	function parseTime(text) {
		var value = Date.parse(text);
		if (!value) value = now;
		return {
			text:text,
			value:value,
			top: (now-value)*scale
		}
	}

	function addPath(path, color) {
		path = snap.path(path.join(' '));
		path.attr({
			stroke: color,
			strokeWidth: 1.5,
			strokeLinecap: 'round',
			fill: 'none',
		});
		return path;
	}

	function addLine(path, color) {
		path = snap.line(path[0], path[1], path[2], path[3]);
		path.attr({
			stroke: color,
			strokeWidth: 1.5
		});
		return path;
	}

	function addArrow(d, color) {
		var path = snap.line(d[0], d[1], d[2], d[3]+10);
		path.attr({
			stroke: color,
			strokeWidth: 5
		});

		var marker = snap.polygon([
			d[2], d[3],
			d[2]-10, d[3]+20,
			d[2]+10, d[3]+20,
			d[2], d[3]
		])
		marker.attr({
			fill: color,
			stroke:'none'
		});
		return snap.g(path, marker);
	}
})