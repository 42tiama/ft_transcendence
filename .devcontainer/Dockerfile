FROM node:22.14

ENV LANG=en_US.utf8
ENV LANGUAGE=en_US.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

ENV NODE_PATH=/usr/local/lib/node_modules
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV NODE_ENV=development

RUN npm install -g pino-pretty@13.0.0

#neovim rocks
RUN apt-get update && apt-get install -y libfuse2 fuse lua5.4 tmux tree sqlite3 lsof
RUN curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.appimage &&\
	chmod +x nvim-linux-x86_64.appimage &&\
	mv nvim-linux-x86_64.appimage /usr/bin/nvim &&\
	echo "alias nvim='/usr/bin/nvim --appimage-extract-and-run'" >> /home/node/.bashrc &&\
	echo "alias tmux='tmux -2'" >> /home/node/.bashrc
RUN curl -L https://raw.githubusercontent.com/iuryr/kickstart.nvim/refs/heads/master/init.lua --create-dirs --output /home/node/.config/nvim/init.lua
RUN curl -L https://raw.githubusercontent.com/iuryr/kickstart.nvim/refs/heads/master/lua/kickstart/plugins/autoformat.lua --create-dirs --output /home/node/.config/nvim/lua/kickstart/plugins/autoformat.lua
RUN chown node:node -R /home/node/.config
RUN mkdir -p /home/node/.local && chown node:node -R /home/node/.local

WORKDIR /fullbase/src

CMD sleep infinity
