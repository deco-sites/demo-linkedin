
/**
 * @title {{{text}}}
 */
interface Benefit {
    text: string;
}
interface Props {
    benefits: Benefit[]
}

export default function Benefits({ benefits }: Props) {

    return (
        <div class="px-4">
            <div class="flex justify-between background-menu p-3 rounded-lg">
                {benefits.map((benefit) => (
                    <div class="col-span-1">
                        <p class="text-xs">{benefit.text}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}