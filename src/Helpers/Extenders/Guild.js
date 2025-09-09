const { Guild, ChannelType } = require("discord.js");

Guild.prototype.findMatchingChannel = function (query, type = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice]) {
  if (!this || !query || typeof query !== "string") return null;
  const channelManager = this.channels.cache.filter((ch) => type.includes(ch.type));

  const patternMatch = query.match(/<?#?(\d{17,20})>?/);
  if (patternMatch) {
    const id = patternMatch[1];
    const channel = channelManager.get(id);
    if (channel) {
      return channel;
    }
  }

  let closestMatch = null;

  channelManager.forEach((ch) => {
    const lowerName = ch.name.toLowerCase();
    if (ch.name === query && !closestMatch) {
      closestMatch = ch;
    } else if (lowerName.startsWith(query.toLowerCase()) && !closestMatch) {
      closestMatch = ch;
    } else if (lowerName.includes(query.toLowerCase()) && !closestMatch) {
      closestMatch = ch;
    }
  });


  return closestMatch;
};

Guild.prototype.findMatchingRole = function (query) {
  if (!this || !query || typeof query !== "string") return null;

  const patternMatch = query.match(/<?@?&?(\d{17,20})>?/);
  if (patternMatch) {
    const id = patternMatch[1];
    const role = this.roles.cache.find((r) => r.id === id);
    if (role) return role;
  }

  let closestMatch = null;

  this.roles.cache.forEach((role) => {
    const lowerName = role.name.toLowerCase();
    if (role.name === query && !closestMatch) closestMatch = role;
    else if (lowerName.startsWith(query.toLowerCase()) && !closestMatch) closestMatch = role;
    else if (lowerName.includes(query.toLowerCase()) && !closestMatch) closestMatch = role;
  });

  return closestMatch;
};

Guild.prototype.resolveMember = async function (query, exact = false) {
  if (!query || typeof query !== "string") return;

  const patternMatch = query.match(/<?@?!?(\d{17,20})>?/);
  if (patternMatch) {
    const id = patternMatch[1];
    const fetched = await this.members.fetch({ user: id }).catch(() => {});
    if (fetched) return fetched;
  }

  await this.members.fetch({ query }).catch(() => {});

  const matchingTags = this.members.cache.filter((mem) => mem.user.tag === query);
  if (matchingTags.size === 1) return matchingTags.first();

  if (!exact) {
    return this.members.cache.find(
      (x) =>
        x.user.username === query ||
        x.user.username.toLowerCase().includes(query.toLowerCase()) ||
        x.displayName.toLowerCase().includes(query.toLowerCase())
    );
  }
};