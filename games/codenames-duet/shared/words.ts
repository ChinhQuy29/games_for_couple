// Word lists for the board. Common, picturable nouns that make for good clues.

export const WORDS_EN = `
apple anchor angel ant arm army baby ball band bank bar bark bat bath battery beach bear bed bee bell belt bench
berry bicycle bird birthday board boat bomb bone book boot bottle bow box bread bridge brush bubble bucket bug
cake camera camp candle cap car card carrot castle cat cave chair chalk cheese chest chicken chocolate circle city
clock cloud coast coat code coffee coin cold comet computer cook copper corn cotton court cow crab crane crown
cup curtain dance date day deck desert diamond dinosaur doctor dog doll door dragon dream dress drill drum duck
eagle earth egg engine eye face fair fan farm feather fence field file fire fish flag flute fog foot forest fork
fountain fox frog game garden gas ghost giant gift glass glove gold grape grass guitar hair ham hammer hand hat
heart helmet hole honey hook horn horse hospital hotel house ice ink island jacket jam jelly jet key king kite
kiss kitchen knife knight lab ladder lamp laser leaf lemon letter light lion lock love magic mail map mask match
medal milk mill mirror money monkey moon mountain mouse mouth movie mud music nail net night ninja nose nurse
ocean octopus oil orange owl paint palm pan paper park party pass pen penguin piano pie pig pilot pin pipe pirate
pizza plane planet plant plate pool post pot potato queen rabbit radio rain rainbow ring river robot rock rocket
rose ruler salt sand school scissors sea seal shadow shark sheep shell ship shoe shop silk singer skate sky sleep
snake snow sock soldier song soup space spider spoon spring square star station storm stream string sugar sun
swan sword table tail tea teacher teeth telescope tent tiger tire toast tooth tower toy train tree truck trumpet
turtle umbrella unicorn vampire violin volcano wall watch water wave whale wheel whistle window wine wing winter
witch wolf worm zoo
`.trim().split(/\s+/);

export const WORDS_VI = `
táo biển núi sông mưa nắng gió mây trăng sao mặt_trời hoa lá cây cỏ rừng đảo hang đá cát
mèo chó gà vịt cá chim bò heo ngựa khỉ voi hổ sư_tử rắn ếch rùa ong bướm kiến chuột
nhà cửa bàn ghế giường gương đèn đồng_hồ chìa_khóa điện_thoại máy_tính tivi quạt tủ_lạnh ly chén đũa muỗng nồi chảo
bánh_mì phở cơm trà cà_phê sữa kẹo bánh_kem kem trứng muối đường ớt chanh dưa_hấu xoài chuối dừa
áo quần giày mũ kính nhẫn túi ô dây_chuyền khăn
xe_đạp xe_máy ô_tô tàu máy_bay thuyền tên_lửa trường bệnh_viện chợ chùa cầu tháp lâu_đài công_viên sân_bay
bác_sĩ giáo_viên ca_sĩ phi_công cảnh_sát vua hoàng_hậu ma rồng tiên siêu_nhân robot cướp_biển
bóng đàn trống sách bút giấy thư ảnh phim nhạc tranh búp_bê diều
tim lửa nước băng tuyết sấm cầu_vồng bóng_tối ánh_sáng giấc_mơ nụ_hôn quà tiền vàng kim_cương
bàn_chải xà_phòng khẩu_trang pin nến lồng_đèn pháo_hoa tết trung_thu sinh_nhật đám_cưới du_lịch
`.trim().split(/\s+/).map((w) => w.replace(/_/g, ' '));

export const LANGUAGES = { en: { label: '🇬🇧 English', words: WORDS_EN }, vi: { label: '🇻🇳 Tiếng Việt', words: WORDS_VI } } as const;
export type Lang = keyof typeof LANGUAGES;
