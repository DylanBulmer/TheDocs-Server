NODE=node
NPM=npm

build:
	$(NODE) -v
	$(NPM) install
    echo "Creating a service for The Docs"
    cp ./service /etc/systemd/system/thedocs.service

clean:
	rm -R ./node_modules/
	$(NPM) install