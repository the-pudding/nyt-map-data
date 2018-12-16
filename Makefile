page-one:
	csvstack output/months-page-one/*.csv > output/all-page-one.csv;
	csvcut -c web_url,print_page,pub_date,headline output/all-page-one.csv > output/all-page-one--lite.csv;