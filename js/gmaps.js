function init_map(){
    var myOptions = {
        zoom:18,
        center:new google.maps.LatLng(-7.276763599999979,112.79506515890196),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
map = new google.maps.Map(document.getElementById('gmap_canvas'), myOptions);
marker = new google.maps.Marker({
    map: map,
    position: new google.maps.LatLng(-7.276763599999979,112.79506515890196)
});
infowindow = new google.maps.InfoWindow({
    content:'<strong>Politeknik Elektronika Negeri Surabaya</strong>'
});
google.maps.event.addListener(marker, 'click', function(){
    infowindow.open(map,marker);
});
infowindow.open(map,marker);}
google.maps.event.addDomListener(window, 'load', init_map);