import { type Tweet } from "@/lib/tweets";
import { LEAGUE_TEAMS } from "@/lib/constants";

export const filterTweetsByLeague = (
  tweets: Tweet[],
  selectedLeague: string | null
): Tweet[] => {
  if (!selectedLeague) {
    return tweets;
  }

  if (selectedLeague === "Others") {
    const allMajorLeagueTeams: string[] = [];
    Object.keys(LEAGUE_TEAMS).forEach((league) => {
      if (league !== "Others") {
        allMajorLeagueTeams.push(...LEAGUE_TEAMS[league]);
      }
    });

    return tweets.filter((tweet) => {
      const tweetText = tweet.tweet_text.toLowerCase();
      return !allMajorLeagueTeams.some((team) =>
        tweetText.includes(team.toLowerCase())
      );
    });
  }

  const teamNames = LEAGUE_TEAMS[selectedLeague] || [];
  if (teamNames.length === 0) {
    return tweets;
  }

  return tweets.filter((tweet) => {
    const tweetText = tweet.tweet_text.toLowerCase();
    return teamNames.some((team) => tweetText.includes(team.toLowerCase()));
  });
};

